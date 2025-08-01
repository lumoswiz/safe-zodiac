import {
  Address,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  encodeFunctionData,
  encodePacked,
  getContractAddress,
  hashTypedData,
  Hex,
  keccak256,
  type PublicClient,
} from 'viem';
import {
  SAFE_PROXY_FACTORY,
  SAFE_SINGLETON,
  SAFE_VERSIONS,
  ZERO_ADDRESS,
} from './constants';
import {
  type GetNonceResult,
  type GetThresholdResult,
  type GetModulesResult,
  type IsModuleEnabledResult,
  type CalculateSafeAddressResult,
  type IsSafeDeployedResult,
  type BuildTxResult,
  type GetVersionResult,
  type SafeVersion,
  type GetOwnersResult,
  type IsOwnerResult,
  type BuildMetaTxResult,
  type GetSafeTxHashResult,
  type SafeTransactionData,
  type IsTxReadyResult,
  OperationType,
  SafeTransactionDataResult,
  BuildSignSafeTx,
  MetaTransactionData,
  SAFE_VERSION_FALLBACK,
} from '@sdk/types';
import {
  isContractDeployed,
  makeError,
  makeOk,
  matchResult,
  toMetaTx,
} from '../shared/utils';
import { generateSafeTypedData } from './eip712';
import {
  SAFE_PROXY_ABI,
  SAFE_PROXY_FACTORY_ABI,
  SAFE_SINGLETON_ABI,
} from './abi';
import { CHAINS } from '../shared/constants';

export class SafeSuite {
  client: PublicClient;

  constructor(publicClient: PublicClient) {
    this.client = publicClient;
  }

  async calculateSafeAddress(
    owners: Address[],
    saltNonce: bigint
  ): Promise<CalculateSafeAddressResult> {
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

      const salt = keccak256(
        encodePacked(['bytes32', 'uint256'], [keccak256(setup), saltNonce])
      );

      const initCode = encodePacked(
        ['bytes', 'uint256'],
        [proxyCreationCode, BigInt(SAFE_SINGLETON)]
      );

      const address = getContractAddress({
        from: SAFE_PROXY_FACTORY,
        opcode: 'CREATE2',
        bytecode: initCode,
        salt,
      });

      return { status: 'ok', value: address };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  async getNonce(safe: Address): Promise<GetNonceResult> {
    try {
      const nonce = await this.client.readContract({
        abi: SAFE_PROXY_ABI,
        address: safe,
        functionName: 'nonce',
      });
      return { status: 'ok', value: nonce as bigint };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  async getThreshold(safe: Address): Promise<GetThresholdResult> {
    try {
      const threshold = await this.client.readContract({
        abi: SAFE_PROXY_ABI,
        address: safe,
        functionName: 'getThreshold',
      });
      return { status: 'ok', value: threshold as bigint };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  async getModulesForSafe(safe: Address): Promise<GetModulesResult> {
    try {
      const chainId = await this.client.getChainId();
      const network = CHAINS[chainId]!.name;
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

      const data: { modules: string[] } = await resp.json();
      return { status: 'ok', value: data.modules as Address[] };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  async isModuleEnabled(
    safe: Address,
    module: Address
  ): Promise<IsModuleEnabledResult> {
    try {
      const isEnabled = await this.client.readContract({
        abi: SAFE_PROXY_ABI,
        address: safe,
        functionName: 'isModuleEnabled',
        args: [module],
      });
      return { status: 'ok', value: isEnabled as boolean };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  async isSafeDeployed(
    owners: Address[],
    saltNonce: bigint
  ): Promise<IsSafeDeployedResult> {
    try {
      const addrRes = await this.calculateSafeAddress(owners, saltNonce);
      if (addrRes.status === 'error') {
        return { status: 'error', error: addrRes.error };
      }
      const deployed = await isContractDeployed(this.client, addrRes.value);
      return { status: 'ok', value: deployed };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  async buildSafeDeploymentTx(
    owner: Address,
    saltNonce: bigint
  ): Promise<BuildTxResult> {
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
    } catch (error) {
      return makeError(error);
    }
  }

  async getVersion(safe: Address): Promise<GetVersionResult> {
    try {
      const version = await this.client.readContract({
        address: safe,
        abi: SAFE_PROXY_ABI,
        functionName: 'VERSION',
      });

      if (SAFE_VERSIONS.includes(version as SafeVersion)) {
        return { status: 'ok', value: version as SafeVersion };
      }

      return { status: 'error', error: version as string };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { status: 'error', error: msg };
    }
  }

  async getOwners(safe: Address): Promise<GetOwnersResult> {
    try {
      const owners = await this.client.readContract({
        abi: SAFE_PROXY_ABI,
        address: safe,
        functionName: 'getOwners',
      });
      return { status: 'ok', value: owners as Address[] };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  async isOwner(safe: Address, owner: Address): Promise<IsOwnerResult> {
    try {
      const isOwner = await this.client.readContract({
        abi: SAFE_PROXY_ABI,
        address: safe,
        functionName: 'isOwner',
        args: [owner],
      });
      return { status: 'ok', value: isOwner as boolean };
    } catch (error) {
      return { status: 'error', error };
    }
  }

  async buildRawEnableModuleMetaTx(
    safe: Address,
    module: Address
  ): Promise<MetaTransactionData> {
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

  async buildEnableModuleTx(
    safe: Address,
    module: Address
  ): Promise<BuildSignSafeTx> {
    const data = encodeFunctionData({
      abi: SAFE_PROXY_ABI,
      functionName: 'enableModule',
      args: [module] as const,
    });
    return this.buildSignSafeTx(safe, safe, data);
  }

  async buildDisableModuleTx(
    safe: Address,
    prevModule: Address,
    module: Address
  ): Promise<BuildSignSafeTx> {
    const data = encodeFunctionData({
      abi: SAFE_PROXY_ABI,
      functionName: 'disableModule',
      args: [prevModule, module] as const,
    });
    return this.buildSignSafeTx(safe, safe, data);
  }

  async getSafeTransactionHash(
    safe: Address,
    tx: SafeTransactionData,
    version: SafeVersion,
    chainId: number
  ): Promise<GetSafeTxHashResult> {
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
      } else {
        const typedData = generateSafeTypedData({
          safeAddress: safe,
          safeVersion: version,
          chainId,
          data: tx,
        });
        const hash = hashTypedData(typedData);
        return { status: 'ok', value: hash };
      }
    } catch (error) {
      return { status: 'error', error };
    }
  }

  async isTransactionReady(
    safe: Address,
    hash: Hex,
    txData: Hex,
    signatures: Hex[],
    threshold: bigint
  ): Promise<IsTxReadyResult> {
    try {
      const sigBlob = encodePacked(
        signatures.map(() => 'bytes'),
        signatures
      );

      await this.client.readContract({
        abi: SAFE_PROXY_ABI,
        address: safe,
        functionName: 'checkNSignatures',
        args: [hash, txData, sigBlob, threshold],
      });
      return { status: 'ok', value: true };
    } catch (e: any) {
      if (
        e instanceof ContractFunctionRevertedError ||
        e instanceof ContractFunctionExecutionError
      ) {
        return { status: 'ok', value: false };
      }
      return { status: 'error', error: e };
    }
  }

  async buildExecTransaction(
    safe: Address,
    tx: SafeTransactionData,
    signatures: Hex
  ): Promise<BuildMetaTxResult> {
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
    } catch (error) {
      return { status: 'error', error };
    }
  }

  private async buildSafeTransactionData(
    safe: Address,
    to: Address,
    data: Hex,
    operation: OperationType = OperationType.Call,
    isSafeDeployed: boolean = true
  ): Promise<SafeTransactionDataResult> {
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

  private async resolveNonce(
    safe: Address,
    useOnChainNonce: boolean
  ): Promise<bigint> {
    if (!useOnChainNonce) return 0n;

    const nonceResult = await this.getNonce(safe);
    return matchResult(nonceResult, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });
  }

  async buildSignSafeTx(
    safe: Address,
    to: Address,
    data: Hex,
    operation: OperationType = OperationType.Call,
    isSafeDeployed: boolean = true
  ): Promise<BuildSignSafeTx> {
    const txResult = await this.buildSafeTransactionData(
      safe,
      to,
      data,
      operation,
      isSafeDeployed
    );

    return matchResult(txResult, {
      error: ({ error }) => makeError(error),
      ok: async ({ value: txData }) => {
        const version: SafeVersion = isSafeDeployed
          ? await matchResult(await this.getVersion(safe), {
              ok: ({ value }) => value,
              error: () => SAFE_VERSION_FALLBACK,
            })
          : SAFE_VERSION_FALLBACK;

        const chainId = await this.client.getChainId();
        const hashResult = await this.getSafeTransactionHash(
          safe,
          txData,
          version,
          chainId
        );

        return matchResult(hashResult, {
          ok: ({ value: safeTxHash }) => makeOk({ txData, safeTxHash }),
          error: ({ error }) => makeError(error),
        });
      },
    });
  }
}
