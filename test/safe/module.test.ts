import '../setup';
import { testConfig } from '../config';
import { beforeEach, describe, expect, test } from 'bun:test';
import { SafeContractSuite } from '../../src/lib/safe';
import {
  account,
  DEPLOYED_SALT_NONCE,
  DUMMY_MODULE,
  SENTINEL_ADDRESS,
} from '../src/constants';
import { unwrap } from '../utils';
import { match } from '../../src/lib/utils';
import {
  Address,
  createPublicClient,
  Hex,
  http,
  PublicClient,
  walletActions,
} from 'viem';
import { foundry } from 'viem/chains';
import { generateSafeTypedData } from '../../src/lib/safe-eip712';
import { SafeTransactionData } from '../../src/types';

describe('Safe Modules', () => {
  let suite: SafeContractSuite;
  let publicClient: PublicClient;
  let DEPLOYED_SAFE_ADDRESS: Address;

  beforeEach(async () => {
    publicClient = createPublicClient({
      chain: foundry,
      transport: http(testConfig.rpcUrl),
    });
    suite = new SafeContractSuite(publicClient);

    DEPLOYED_SAFE_ADDRESS = unwrap(
      await suite.calculateSafeAddress([account.address], DEPLOYED_SALT_NONCE)
    );
    const txRes = await suite.buildSafeDeploymentTx(
      account.address,
      DEPLOYED_SALT_NONCE
    );
    await match(txRes, {
      error: ({ error }) => {
        throw new Error(error instanceof Error ? error.message : String(error));
      },
      skipped: () => {},
      built: async ({ tx }) => {
        await publicClient.extend(walletActions).sendTransaction({
          account,
          chain: null,
          to: tx.to,
          data: tx.data,
          value: BigInt(tx.value),
        });
      },
    });
  });

  async function signAndExec(
    suite: SafeContractSuite,
    safeAddress: Address,
    txData: SafeTransactionData
  ) {
    const version = unwrap(await suite.getVersion(safeAddress));
    const chainId = await publicClient.getChainId();
    const typedData = generateSafeTypedData({
      safeAddress,
      safeVersion: version,
      chainId,
      data: txData,
    });
    const signature: Hex = await publicClient
      .extend(walletActions)
      .signTypedData({
        account,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

    await match(
      await suite.buildExecTransaction(safeAddress, txData, signature),
      {
        error: ({ error }) => {
          throw new Error(`Could not build execTransaction call: ${error}`);
        },
        ok: async ({ value: { to, data, value } }) => {
          await publicClient.extend(walletActions).sendTransaction({
            account,
            chain: null,
            to,
            data,
            value: BigInt(value),
          });
        },
      }
    );
  }

  test('module is disabled by default', async () => {
    const res = await suite.isModuleEnabled(
      DEPLOYED_SAFE_ADDRESS,
      DUMMY_MODULE
    );
    expect(unwrap(res)).toBe(false);
  });

  test('enableModule tx flips isModuleEnabled to true', async () => {
    let txData: any;
    await match(
      await suite.buildEnableModuleTx(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE),
      {
        error: ({ error }) => {
          throw new Error(`Could not build enableModule tx: ${error}`);
        },
        ok: async ({ value }) => {
          txData = value.txData;
          await signAndExec(suite, DEPLOYED_SAFE_ADDRESS, txData!);
        },
      }
    );
    expect(
      unwrap(await suite.isModuleEnabled(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE))
    ).toBe(true);
  });

  test('disableModule tx flips isModuleEnabled to false', async () => {
    let enableTx: any;
    await match(
      await suite.buildEnableModuleTx(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE),
      {
        error: ({ error }) => {
          throw new Error(`Could not build enableModule tx: ${error}`);
        },
        ok: async ({ value }) => {
          enableTx = value.txData;
          await signAndExec(suite, DEPLOYED_SAFE_ADDRESS, enableTx!);
        },
      }
    );
    expect(
      unwrap(await suite.isModuleEnabled(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE))
    ).toBe(true);

    let disableTx: any;
    await match(
      await suite.buildDisableModuleTx(
        DEPLOYED_SAFE_ADDRESS,
        SENTINEL_ADDRESS,
        DUMMY_MODULE
      ),
      {
        error: ({ error }) => {
          throw new Error(`Could not build disableModule tx: ${error}`);
        },
        ok: async ({ value }) => {
          disableTx = value.txData;
          await signAndExec(suite, DEPLOYED_SAFE_ADDRESS, disableTx!);
        },
      }
    );
    expect(
      unwrap(await suite.isModuleEnabled(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE))
    ).toBe(false);
  });
});
