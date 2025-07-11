import {
  Address,
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  keccak256,
  type PublicClient,
} from 'viem';
import {
  SAFE_NETWORKS,
  SAFE_PROXY_FACTORY,
  SAFE_SINGLETON,
  ZERO_ADDRESS,
} from './constants';
import {
  SAFE_PROXY_ABI,
  SAFE_PROXY_FACTORY_ABI,
  SAFE_SINGLETON_ABI,
} from './abi';
import { BuildTxResult } from '../types';
import { isContractDeployed } from './utils';

export class SafeContractSuite {
  client: PublicClient;

  constructor(publicClient: PublicClient) {
    this.client = publicClient;
  }

  async calculateSafeAddress(
    owners: Address[],
    saltNonce: bigint
  ): Promise<Address> {
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

    const salt = keccak256(
      encodePacked(['bytes32', 'uint256'], [keccak256(setup), saltNonce])
    );

    const initCode = encodePacked(
      ['bytes', 'uint256'],
      [proxyCreationCode, BigInt(SAFE_SINGLETON)]
    );

    return getContractAddress({
      from: SAFE_PROXY_FACTORY,
      opcode: 'CREATE2',
      bytecode: initCode,
      salt,
    });
  }

  async getNonce(safe: Address): Promise<bigint> {
    const nonce = await this.client.readContract({
      abi: SAFE_PROXY_ABI,
      address: safe,
      functionName: 'nonce',
    });
    return nonce;
  }

  async getThreshold(safe: Address): Promise<bigint> {
    const threshold = await this.client.readContract({
      abi: SAFE_PROXY_ABI,
      address: safe,
      functionName: 'getThreshold',
    });
    return threshold;
  }

  async getModulesForSafe(safe: Address): Promise<Address[]> {
    const chainId = await this.client.getChainId();
    const network = SAFE_NETWORKS[chainId];
    if (!network) {
      throw new Error(`Unsupported network for chainId ${chainId}`);
    }

    const url = `https://safe-transaction-${network}.safe.global/api/v1/safes/${safe}/modules/`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' },
    });

    if (!resp.ok) {
      throw new Error(
        `Error fetching modules for ${safe} on ${network}: ${resp.statusText}`
      );
    }

    const data: { modules: string[] } = await resp.json();
    return data.modules as Address[];
  }

  async isModuleEnabled(safe: Address, module: Address): Promise<boolean> {
    const isEnabled = await this.client.readContract({
      abi: SAFE_PROXY_ABI,
      address: safe,
      functionName: 'isModuleEnabled',
      args: [module],
    });
    return isEnabled;
  }

  async isSafeDeployed(owners: Address[], saltNonce: bigint): Promise<boolean> {
    const safeAddress = await this.calculateSafeAddress(owners, saltNonce);
    return isContractDeployed(this.client, safeAddress);
  }

  async buildSafeDeploymentTx(
    owner: Address,
    saltNonce: bigint
  ): Promise<BuildTxResult> {
    const deployed = await this.isSafeDeployed([owner], saltNonce);

    if (deployed) {
      return { status: 'skipped' };
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

    const data = encodeFunctionData({
      abi: SAFE_PROXY_FACTORY_ABI,
      functionName: 'createProxyWithNonce',
      args: [SAFE_SINGLETON, setup, saltNonce],
    });

    return {
      status: 'built',
      tx: { to: SAFE_PROXY_FACTORY, value: '0x0', data },
    };
  }
}
