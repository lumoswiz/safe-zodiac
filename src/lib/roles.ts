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
import { BuildTxResult } from '../types';
import { isContractDeployed } from './utils';

export class ZodiacRolesSuite {
  client: PublicClient;

  constructor(publicClient: PublicClient) {
    this.client = publicClient;
  }

  calculateModuleProxyAddress(safe: Address, saltNonce: bigint): Address {
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
      [PROXY_BYTECODE_PREFIX, ROLES_V2_MODULE_MASTERCOPY, PROXY_BYTECODE_SUFFIX]
    );
    return getContractAddress({
      from: MODULE_PROXY_FACTORY,
      opcode: 'CREATE2',
      salt,
      bytecode,
    });
  }

  async buildDeployModuleTx(
    safe: Address,
    saltNonce: bigint
  ): Promise<BuildTxResult> {
    const deployed = await this.isModuleDeployed(safe, saltNonce);
    if (deployed) {
      return { status: 'skipped' };
    }

    const to = MODULE_PROXY_FACTORY;
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
      tx: { to, value: '0x0', data },
    };
  }

  async isModuleDeployed(safe: Address, saltNonce: bigint): Promise<boolean> {
    const moduleAddress = this.calculateModuleProxyAddress(safe, saltNonce);
    return isContractDeployed(this.client, moduleAddress);
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
}
