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
import { signAndExec, unwrap } from '../utils';
import { match } from '../../src/lib/utils';
import {
  Address,
  createPublicClient,
  http,
  PublicClient,
  walletActions,
} from 'viem';
import { foundry } from 'viem/chains';

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
          await signAndExec(suite, DEPLOYED_SAFE_ADDRESS, txData!, account);
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
          await signAndExec(suite, DEPLOYED_SAFE_ADDRESS, enableTx!, account);
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
          await signAndExec(suite, DEPLOYED_SAFE_ADDRESS, disableTx!, account);
        },
      }
    );
    expect(
      unwrap(await suite.isModuleEnabled(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE))
    ).toBe(false);
  });
});
