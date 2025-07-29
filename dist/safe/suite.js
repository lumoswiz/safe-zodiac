import { ContractFunctionExecutionError, ContractFunctionRevertedError, encodeFunctionData, encodePacked, getContractAddress, hashTypedData, keccak256, } from 'viem';
import { SAFE_PROXY_FACTORY, SAFE_SINGLETON, SAFE_VERSIONS, ZERO_ADDRESS, } from './constants';
import { OperationType, SAFE_VERSION_FALLBACK, } from '@sdk/types';
import { isContractDeployed, makeError, makeOk, matchResult, toMetaTx, } from '../shared/utils';
import { generateSafeTypedData } from './eip712';
import { SAFE_PROXY_ABI, SAFE_PROXY_FACTORY_ABI, SAFE_SINGLETON_ABI, } from './abi';
import { CHAINS } from '../shared/constants';
export class SafeSuite {
    constructor(publicClient) {
        this.client = publicClient;
    }
    async calculateSafeAddress(owners, saltNonce) {
        try {
            const proxyCreationCode = await this.client.readContract({
                address: SAFE_PROXY_FACTORY,
                abi: SAFE_PROXY_FACTORY_ABI,
                functionName: 'proxyCreationCode',
            });
            const setup = encodeFunctionData({
                abi: SAFE_SINGLETON_ABI,
                functionName: 'setup',
                args: [
                    owners,
                    1n,
                    ZERO_ADDRESS,
                    '0x',
                    ZERO_ADDRESS,
                    ZERO_ADDRESS,
                    0n,
                    ZERO_ADDRESS,
                ],
            });
            const salt = keccak256(encodePacked(['bytes32', 'uint256'], [keccak256(setup), saltNonce]));
            const initCode = encodePacked(['bytes', 'uint256'], [proxyCreationCode, BigInt(SAFE_SINGLETON)]);
            const address = getContractAddress({
                from: SAFE_PROXY_FACTORY,
                opcode: 'CREATE2',
                bytecode: initCode,
                salt,
            });
            return { status: 'ok', value: address };
        }
        catch (error) {
            return { status: 'error', error };
        }
    }
    async getNonce(safe) {
        try {
            const nonce = await this.client.readContract({
                abi: SAFE_PROXY_ABI,
                address: safe,
                functionName: 'nonce',
            });
            return { status: 'ok', value: nonce };
        }
        catch (error) {
            return { status: 'error', error };
        }
    }
    async getThreshold(safe) {
        try {
            const threshold = await this.client.readContract({
                abi: SAFE_PROXY_ABI,
                address: safe,
                functionName: 'getThreshold',
            });
            return { status: 'ok', value: threshold };
        }
        catch (error) {
            return { status: 'error', error };
        }
    }
    async getModulesForSafe(safe) {
        try {
            const chainId = await this.client.getChainId();
            const network = CHAINS[chainId].name;
            if (!network) {
                return {
                    status: 'error',
                    error: `Unsupported network for chainId ${chainId}`,
                };
            }
            const url = `https://safe-transaction-${network}.safe.global/api/v1/safes/${safe}/modules/`;
            const resp = await fetch(url, {
                method: 'GET',
                headers: { accept: 'application/json' },
            });
            if (!resp.ok) {
                return {
                    status: 'error',
                    error: `Error fetching modules: ${resp.statusText}`,
                };
            }
            const data = await resp.json();
            return { status: 'ok', value: data.modules };
        }
        catch (error) {
            return { status: 'error', error };
        }
    }
    async isModuleEnabled(safe, module) {
        try {
            const isEnabled = await this.client.readContract({
                abi: SAFE_PROXY_ABI,
                address: safe,
                functionName: 'isModuleEnabled',
                args: [module],
            });
            return { status: 'ok', value: isEnabled };
        }
        catch (error) {
            return { status: 'error', error };
        }
    }
    async isSafeDeployed(owners, saltNonce) {
        try {
            const addrRes = await this.calculateSafeAddress(owners, saltNonce);
            if (addrRes.status === 'error') {
                return { status: 'error', error: addrRes.error };
            }
            const deployed = await isContractDeployed(this.client, addrRes.value);
            return { status: 'ok', value: deployed };
        }
        catch (error) {
            return { status: 'error', error };
        }
    }
    async buildSafeDeploymentTx(owner, saltNonce) {
        try {
            const deployedRes = await this.isSafeDeployed([owner], saltNonce);
            if (deployedRes.status === 'error') {
                return makeError(deployedRes.error);
            }
            if (deployedRes.value) {
                return makeOk({ kind: 'skipped' });
            }
            const setup = encodeFunctionData({
                abi: SAFE_SINGLETON_ABI,
                functionName: 'setup',
                args: [
                    [owner],
                    1n,
                    ZERO_ADDRESS,
                    '0x',
                    ZERO_ADDRESS,
                    ZERO_ADDRESS,
                    0n,
                    ZERO_ADDRESS,
                ],
            });
            return makeOk({
                kind: 'built',
                tx: toMetaTx({
                    to: SAFE_PROXY_FACTORY,
                    data: encodeFunctionData({
                        abi: SAFE_PROXY_FACTORY_ABI,
                        functionName: 'createProxyWithNonce',
                        args: [SAFE_SINGLETON, setup, saltNonce],
                    }),
                }),
            });
        }
        catch (error) {
            return makeError(error);
        }
    }
    async getVersion(safe) {
        try {
            const version = await this.client.readContract({
                address: safe,
                abi: SAFE_PROXY_ABI,
                functionName: 'VERSION',
            });
            if (SAFE_VERSIONS.includes(version)) {
                return { status: 'ok', value: version };
            }
            return { status: 'error', error: version };
        }
        catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            return { status: 'error', error: msg };
        }
    }
    async getOwners(safe) {
        try {
            const owners = await this.client.readContract({
                abi: SAFE_PROXY_ABI,
                address: safe,
                functionName: 'getOwners',
            });
            return { status: 'ok', value: owners };
        }
        catch (error) {
            return { status: 'error', error };
        }
    }
    async isOwner(safe, owner) {
        try {
            const isOwner = await this.client.readContract({
                abi: SAFE_PROXY_ABI,
                address: safe,
                functionName: 'isOwner',
                args: [owner],
            });
            return { status: 'ok', value: isOwner };
        }
        catch (error) {
            return { status: 'error', error };
        }
    }
    async buildRawEnableModuleMetaTx(safe, module) {
        return {
            to: safe,
            value: '0x0',
            data: encodeFunctionData({
                abi: SAFE_PROXY_ABI,
                functionName: 'enableModule',
                args: [module],
            }),
            operation: 0,
        };
    }
    async buildEnableModuleTx(safe, module) {
        const data = encodeFunctionData({
            abi: SAFE_PROXY_ABI,
            functionName: 'enableModule',
            args: [module],
        });
        return this.buildSignSafeTx(safe, safe, data);
    }
    async buildDisableModuleTx(safe, prevModule, module) {
        const data = encodeFunctionData({
            abi: SAFE_PROXY_ABI,
            functionName: 'disableModule',
            args: [prevModule, module],
        });
        return this.buildSignSafeTx(safe, safe, data);
    }
    async getSafeTransactionHash(safe, tx, version, chainId) {
        try {
            const deployed = await isContractDeployed(this.client, safe);
            if (deployed) {
                const hash = await this.client.readContract({
                    abi: SAFE_PROXY_ABI,
                    address: safe,
                    functionName: 'getTransactionHash',
                    args: [
                        tx.to,
                        BigInt(tx.value),
                        tx.data,
                        tx.operation,
                        tx.safeTxGas,
                        tx.baseGas,
                        tx.gasPrice,
                        tx.gasToken,
                        tx.refundReceiver,
                        tx.nonce,
                    ],
                });
                return { status: 'ok', value: hash };
            }
            else {
                const typedData = generateSafeTypedData({
                    safeAddress: safe,
                    safeVersion: version,
                    chainId,
                    data: tx,
                });
                const hash = hashTypedData(typedData);
                return { status: 'ok', value: hash };
            }
        }
        catch (error) {
            return { status: 'error', error };
        }
    }
    async isTransactionReady(safe, hash, txData, signatures, threshold) {
        try {
            const sigBlob = encodePacked(signatures.map(() => 'bytes'), signatures);
            await this.client.readContract({
                abi: SAFE_PROXY_ABI,
                address: safe,
                functionName: 'checkNSignatures',
                args: [hash, txData, sigBlob, threshold],
            });
            return { status: 'ok', value: true };
        }
        catch (e) {
            if (e instanceof ContractFunctionRevertedError ||
                e instanceof ContractFunctionExecutionError) {
                return { status: 'ok', value: false };
            }
            return { status: 'error', error: e };
        }
    }
    async buildExecTransaction(safe, tx, signatures) {
        try {
            const data = encodeFunctionData({
                abi: SAFE_PROXY_ABI,
                functionName: 'execTransaction',
                args: [
                    tx.to,
                    BigInt(tx.value),
                    tx.data,
                    tx.operation,
                    tx.safeTxGas,
                    tx.baseGas,
                    tx.gasPrice,
                    tx.gasToken,
                    tx.refundReceiver,
                    signatures,
                ],
            });
            return {
                status: 'ok',
                value: {
                    to: safe,
                    value: '0x00',
                    data,
                },
            };
        }
        catch (error) {
            return { status: 'error', error };
        }
    }
    async buildSafeTransactionData(safe, to, data, operation = OperationType.Call, isSafeDeployed = true) {
        const nonce = await this.resolveNonce(safe, isSafeDeployed);
        return makeOk({
            to,
            value: '0x0',
            data,
            operation,
            safeTxGas: 0n,
            baseGas: 0n,
            gasPrice: 0n,
            gasToken: ZERO_ADDRESS,
            refundReceiver: ZERO_ADDRESS,
            nonce,
        });
    }
    async resolveNonce(safe, useOnChainNonce) {
        if (!useOnChainNonce)
            return 0n;
        const nonceResult = await this.getNonce(safe);
        return matchResult(nonceResult, {
            ok: ({ value }) => value,
            error: ({ error }) => Promise.reject(error),
        });
    }
    async buildSignSafeTx(safe, to, data, operation = OperationType.Call, isSafeDeployed = true) {
        const txResult = await this.buildSafeTransactionData(safe, to, data, operation, isSafeDeployed);
        return matchResult(txResult, {
            error: ({ error }) => makeError(error),
            ok: async ({ value: txData }) => {
                const version = isSafeDeployed
                    ? await matchResult(await this.getVersion(safe), {
                        ok: ({ value }) => value,
                        error: () => SAFE_VERSION_FALLBACK,
                    })
                    : SAFE_VERSION_FALLBACK;
                const chainId = await this.client.getChainId();
                const hashResult = await this.getSafeTransactionHash(safe, txData, version, chainId);
                return matchResult(hashResult, {
                    ok: ({ value: safeTxHash }) => makeOk({ txData, safeTxHash }),
                    error: ({ error }) => makeError(error),
                });
            },
        });
    }
}
