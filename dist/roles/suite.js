import { encodeAbiParameters, encodeFunctionData, encodePacked, getContractAddress, keccak256, parseAbiParameters, } from 'viem';
import { MODULE_PROXY_FACTORY_ABI, ROLES_V2_MODULE_ABI } from './abi';
import { MODULE_PROXY_FACTORY, PROXY_BYTECODE_PREFIX, PROXY_BYTECODE_SUFFIX, ROLES_V2_MODULE_MASTERCOPY, } from './constants';
import { isContractDeployed, makeError, makeOk, matchResult, toMetaTx, } from '../shared/utils';
export class RolesSuite {
    constructor(publicClient) {
        this.client = publicClient;
    }
    calculateModuleProxyAddress(safe, saltNonce) {
        try {
            const initParams = encodeAbiParameters(parseAbiParameters('address _owner, address _avatar, address _target'), [safe, safe, safe]);
            const moduleSetupData = encodeFunctionData({
                abi: ROLES_V2_MODULE_ABI,
                functionName: 'setUp',
                args: [initParams],
            });
            const salt = keccak256(encodePacked(['bytes32', 'uint256'], [keccak256(moduleSetupData), saltNonce]));
            const bytecode = encodePacked(['bytes', 'address', 'bytes'], [
                PROXY_BYTECODE_PREFIX,
                ROLES_V2_MODULE_MASTERCOPY,
                PROXY_BYTECODE_SUFFIX,
            ]);
            const address = getContractAddress({
                from: MODULE_PROXY_FACTORY,
                opcode: 'CREATE2',
                salt,
                bytecode,
            });
            return makeOk(address);
        }
        catch (error) {
            return makeError(error);
        }
    }
    async isModuleDeployed(safe, saltNonce) {
        const addrRes = this.calculateModuleProxyAddress(safe, saltNonce);
        const address = await matchResult(addrRes, {
            ok: ({ value }) => value,
            error: ({ error }) => Promise.reject(error),
        });
        const deployed = await isContractDeployed(this.client, address);
        return { status: 'ok', value: deployed };
    }
    async buildDeployModuleTx(safe, saltNonce) {
        try {
            const deployedRes = await this.isModuleDeployed(safe, saltNonce);
            if (deployedRes.status === 'error') {
                return makeError(deployedRes.error);
            }
            if (deployedRes.value) {
                return makeOk({ kind: 'skipped' });
            }
            return makeOk({
                kind: 'built',
                tx: toMetaTx({
                    to: MODULE_PROXY_FACTORY,
                    data: encodeFunctionData({
                        abi: MODULE_PROXY_FACTORY_ABI,
                        functionName: 'deployModule',
                        args: [
                            ROLES_V2_MODULE_MASTERCOPY,
                            this.getModuleSetUpData(safe),
                            BigInt(saltNonce),
                        ],
                    }),
                }),
            });
        }
        catch (error) {
            return makeError(error);
        }
    }
    getModuleSetUpData(safe) {
        return encodeFunctionData({
            abi: ROLES_V2_MODULE_ABI,
            functionName: 'setUp',
            args: [
                encodeAbiParameters(parseAbiParameters('address,address,address'), [
                    safe,
                    safe,
                    safe,
                ]),
            ],
        });
    }
    async buildAssignRolesTx(module, member, roleKeys, memberOf) {
        try {
            return makeOk(toMetaTx({
                to: module,
                data: encodeFunctionData({
                    abi: ROLES_V2_MODULE_ABI,
                    functionName: 'assignRoles',
                    args: [member, roleKeys, memberOf],
                }),
            }));
        }
        catch (error) {
            return makeError(error);
        }
    }
    async isModuleEnabled(module, member) {
        try {
            const isEnabled = await this.client.readContract({
                abi: ROLES_V2_MODULE_ABI,
                address: module,
                functionName: 'isModuleEnabled',
                args: [member],
            });
            return makeOk(isEnabled);
        }
        catch (error) {
            return makeError(error);
        }
    }
    async buildScopeTargetTx(module, roleKey, target) {
        try {
            return makeOk(toMetaTx({
                to: module,
                data: encodeFunctionData({
                    abi: ROLES_V2_MODULE_ABI,
                    functionName: 'scopeTarget',
                    args: [roleKey, target],
                }),
            }));
        }
        catch (error) {
            return makeError(error);
        }
    }
    async buildScopeFunctionTx(module, roleKey, target, selector, conditions, executionOpts) {
        try {
            return makeOk(toMetaTx({
                to: module,
                data: encodeFunctionData({
                    abi: ROLES_V2_MODULE_ABI,
                    functionName: 'scopeFunction',
                    args: [roleKey, target, selector, conditions, executionOpts],
                }),
                operation: 0,
            }));
        }
        catch (error) {
            return makeError(error);
        }
    }
}
