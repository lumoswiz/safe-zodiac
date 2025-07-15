import '../setup';
import { testConfig } from '../config';
import { beforeEach, describe, expect, test } from 'bun:test';
import { SafeContractSuite } from '../../src/lib/safe';
import {
  account,
  DEPLOYED_SALT_NONCE,
  DUMMY_MODULE,
  FAKE_SIGNATURE,
} from '../src/constants';
import { sign, unwrap } from '../utils';
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

describe('isTransactionReady helper', () => {
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

  test('isTransactionReady returns false when no signatures', async () => {
    const { txData, safeTxHash } = unwrap(
      await suite.buildEnableModuleTx(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE)
    );

    const threshold = unwrap(await suite.getThreshold(DEPLOYED_SAFE_ADDRESS));

    const ready = unwrap(
      await suite.isTransactionReady(
        DEPLOYED_SAFE_ADDRESS,
        safeTxHash,
        txData.data,
        [FAKE_SIGNATURE],
        threshold
      )
    );
    expect(ready).toBe(false);
  });

  test('isTransactionReady returns true when correct signatures', async () => {
    const { txData, safeTxHash } = unwrap(
      await suite.buildEnableModuleTx(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE)
    );

    const threshold = unwrap(await suite.getThreshold(DEPLOYED_SAFE_ADDRESS));

    const signature = await sign(suite, DEPLOYED_SAFE_ADDRESS, txData, account);

    const ready = unwrap(
      await suite.isTransactionReady(
        DEPLOYED_SAFE_ADDRESS,
        safeTxHash,
        txData.data,
        [signature],
        threshold
      )
    );
    expect(ready).toBe(true);
  });
});
