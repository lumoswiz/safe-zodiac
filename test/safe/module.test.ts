import '../setup';
import { testConfig } from '../config';
import { beforeEach, describe, expect, test } from 'bun:test';
import { SafeContractSuite } from '../../src/lib/safe';
import { account, DEPLOYED_SALT_NONCE, DUMMY_MODULE } from '../src/constants';
import { unwrap } from '../utils';
import { match } from '../../src/lib/utils';
import {
  Address,
  createPublicClient,
  createTestClient,
  Hex,
  http,
  PublicClient,
  TestClient,
  walletActions,
} from 'viem';
import { foundry } from 'viem/chains';
import { generateSafeTypedData } from '../../src/lib/safe-eip712';

describe('Safe Modules', () => {
  let suite: SafeContractSuite;
  let publicClient: PublicClient;
  let testClient: TestClient;
  let DEPLOYED_SAFE_ADDRESS: Address;

  beforeEach(async () => {
    publicClient = createPublicClient({
      chain: foundry,
      transport: http(testConfig.rpcUrl),
    });
    testClient = createTestClient({
      chain: foundry,
      mode: 'anvil',
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
        await testClient.extend(walletActions).sendTransaction({
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
    await match(
      await suite.buildEnableModuleTx(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE),
      {
        error: ({ error }) => {
          throw new Error(`Could not build enableModule tx: ${error}`);
        },
        ok: async ({ value: { txData } }) => {
          const version = unwrap(await suite.getVersion(DEPLOYED_SAFE_ADDRESS));
          const chainId = await publicClient.getChainId();

          const typedData = generateSafeTypedData({
            safeAddress: DEPLOYED_SAFE_ADDRESS,
            safeVersion: version,
            chainId,
            data: txData,
          });

          const signature: Hex = await testClient
            .extend(walletActions)
            .signTypedData({
              account,
              domain: typedData.domain,
              types: typedData.types,
              primaryType: typedData.primaryType,
              message: typedData.message,
            });

          await match(
            await suite.buildExecTransaction(
              DEPLOYED_SAFE_ADDRESS,
              txData,
              signature
            ),
            {
              error: ({ error }) => {
                throw new Error(
                  `Could not build execTransaction call: ${error}`
                );
              },
              ok: async ({ value: { to, data, value } }) => {
                await testClient.extend(walletActions).sendTransaction({
                  account,
                  chain: null,
                  to,
                  data,
                  value: BigInt(value),
                });
              },
            }
          );
        },
      }
    );
  });
});
