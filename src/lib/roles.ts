import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  Hex,
  keccak256,
  parseAbiParameters,
  type PublicClient,
} from 'viem';
import { MODULE_PROXY_FACTORY_ABI, ROLES_V2_MODULE_ABI } from './abi';
import {
  MODULE_PROXY_FACTORY,
  PROXY_BYTECODE_PREFIX,
  PROXY_BYTECODE_SUFFIX,
  ROLES_V2_MODULE_MASTERCOPY,
} from './constants';
import type {
  BuildMetaTxResult,
  BuildTxResult,
  CalculateModuleProxyAddressResult,
  IsModuleDeployedResult,
  IsModuleEnabledResult,
} from '../types';
import { isContractDeployed } from './utils';

export class ZodiacRolesSuite {
  client: PublicClient;

  constructor(publicClient: PublicClient) {
    this.client = publicClient;
  }

  calculateModuleProxyAddress(
    safe: Address,
    saltNonce: bigint
  ): CalculateModuleProxyAddressResult {
    try {
      const initParams = encodeAbiParameters(
        parseAbiParameters('address _owner, address _avatar, address _target'),
        [safe, safe, safe]
      );
      const moduleSetupData = encodeFunctionData({
        abi: ROLES_V2_MODULE_ABI,
        functionName: 'setUp',
        args: [initParams],
      });
      const salt = keccak256(
        encodePacked(
          ['bytes32', 'uint256'],
          [keccak256(moduleSetupData), saltNonce]
        )
      );
      const bytecode = encodePacked(
        ['bytes', 'address', 'bytes'],
        [
          PROXY_BYTECODE_PREFIX,
          ROLES_V2_MODULE_MASTERCOPY,
          PROXY_BYTECODE_SUFFIX,
        ]
      );
      const address = getContractAddress({
        from: MODULE_PROXY_FACTORY,
        opcode: 'CREATE2',
        salt,
        bytecode,
      });
      return { status: 'ok', value: address };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  async isModuleDeployed(
    safe: Address,
    saltNonce: bigint
  ): Promise<IsModuleDeployedResult> {
    try {
      const addrRes = this.calculateModuleProxyAddress(safe, saltNonce);
      if (addrRes.status === 'error') {
        return { status: 'error', error: addrRes.error };
      }
      const deployed = await isContractDeployed(this.client, addrRes.value);
      return { status: 'ok', value: deployed };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  async buildDeployModuleTx(
    safe: Address,
    saltNonce: bigint
  ): Promise<BuildTxResult> {
    try {
      const deployedRes = await this.isModuleDeployed(safe, saltNonce);
      if (deployedRes.status === 'error') {
        return { status: 'error', error: deployedRes.error };
      }
      if (deployedRes.value) {
        return { status: 'skipped' };
      }

      const data = encodeFunctionData({
        abi: MODULE_PROXY_FACTORY_ABI,
        functionName: 'deployModule',
        args: [
          ROLES_V2_MODULE_MASTERCOPY,
          this.getModuleSetUpData(safe),
          BigInt(saltNonce),
        ],
      });

      return {
        status: 'built',
        tx: { to: MODULE_PROXY_FACTORY, value: '0x0', data },
      };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  private getModuleSetUpData(safe: Address): Hex {
    const inner = encodeAbiParameters(
      parseAbiParameters('address,address,address'),
      [safe, safe, safe]
    );
    return encodeFunctionData({
      abi: ROLES_V2_MODULE_ABI,
      functionName: 'setUp',
      args: [inner],
    });
  }

  async buildAssignRolesTx(
    module: Address,
    member: Address,
    roleKeys: Hex[],
    memberOf: boolean[]
  ): Promise<BuildMetaTxResult> {
    try {
      return {
        status: 'ok',
        value: {
          to: module,
          value: '0x00',
          data: encodeFunctionData({
            abi: ROLES_V2_MODULE_ABI,
            functionName: 'assignRoles',
            args: [member, roleKeys, memberOf],
          }),
        },
      };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  async isModuleEnabled(
    module: Address,
    member: Address
  ): Promise<IsModuleEnabledResult> {
    try {
      const isEnabled = await this.client.readContract({
        abi: ROLES_V2_MODULE_ABI,
        address: module,
        functionName: 'isModuleEnabled',
        args: [member],
      });
      return { status: 'ok', value: isEnabled as boolean };
    } catch (error) {
      return { status: 'error', error };
    }
  }
}
