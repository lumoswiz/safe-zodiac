import '../setup';
import { testConfig } from '../config';
import { beforeEach, describe, expect, test } from 'bun:test';
import { SafeContractSuite } from '../../src/lib/safe';
import { account, DEPLOYED_SALT_NONCE } from '../src/constants';
import { unwrap } from '../utils';
import { match } from '../../src/lib/utils';
import {
  createPublicClient,
  createTestClient,
  http,
  PublicClient,
  TestClient,
  walletActions,
} from 'viem';
import { foundry } from 'viem/chains';

describe('Safe Deployment', () => {
  let testClient: TestClient;
  let publicClient: PublicClient;

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
  });

  test('should deploy a Safe and verify its code', async () => {
    const suite = new SafeContractSuite(publicClient);

    const safeAddressResult = await suite.calculateSafeAddress(
      [account.address],
      DEPLOYED_SALT_NONCE
    );

    const safeAddress = unwrap(safeAddressResult);
    expect(safeAddress).toBeDefined();

    const isDeployedResult = await suite.isSafeDeployed(
      [account.address],
      DEPLOYED_SALT_NONCE
    );

    await match(isDeployedResult, {
      ok: async ({ value }) => {
        expect(value).toBe(false);
      },
      error: ({ error }) => {
        throw new Error(`Failed to check deployment: ${error}`);
      },
    });

    const deploymentResult = await suite.buildSafeDeploymentTx(
      account.address,
      DEPLOYED_SALT_NONCE
    );

    await match(deploymentResult, {
      error: ({ error }) => {
        throw new Error(`Failed to build deployment tx: ${error}`);
      },
      skipped: () => {
        console.log('Deployment skipped, Safe already exists');
        return;
      },
      built: async ({ tx }) => {
        await testClient.extend(walletActions).sendTransaction({
          account,
          chain: null,
          to: tx.to,
          data: tx.data,
          value: BigInt(tx.value),
        });

        const code = await publicClient.getCode({ address: safeAddress });
        expect(code).not.toBe('0x');

        const thresholdResult = await suite.getThreshold(safeAddress);
        expect(unwrap(thresholdResult)).toBe(1n);

        const ownersResult = await suite.getOwners(safeAddress);
        const owners = unwrap(ownersResult);
        expect(owners).toHaveLength(1);
        expect(owners[0]).toBe(account.address);
      },
    });
  });
});
