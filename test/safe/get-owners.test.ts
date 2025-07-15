import '../setup';
import { beforeEach, describe, expect, test } from 'bun:test';
import { SafeContractSuite } from '../../src/lib/safe';
import { account, DEPLOYED_SALT_NONCE } from '../src/constants';
import { unwrap } from '../utils';
import { match } from '../../src/lib/utils';
import {
  Address,
  createPublicClient,
  PublicClient,
  TestClient,
  walletActions,
  http,
  createTestClient,
} from 'viem';
import { foundry } from 'viem/chains';
import { testConfig } from '../config';

let DEPLOYED_SAFE_ADDRESS: Address;
let testClient: TestClient;
let publicClient: PublicClient;
let suite: SafeContractSuite;

describe('Owner Helpers', () => {
  beforeEach(async () => {
    const RPC_URL = testConfig.rpcUrl;

    publicClient = createPublicClient({
      chain: foundry,
      transport: http(RPC_URL),
    });

    testClient = createTestClient({
      chain: foundry,
      mode: 'anvil',
      transport: http(RPC_URL),
    });

    suite = new SafeContractSuite(publicClient);

    DEPLOYED_SAFE_ADDRESS = unwrap(
      await suite.calculateSafeAddress([account.address], DEPLOYED_SALT_NONCE)
    );

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
      },
    });
  });

  test('getOwners includes the deployer', async () => {
    const owners = unwrap(await suite.getOwners(DEPLOYED_SAFE_ADDRESS));
    expect(owners).toContain(account.address);
  });

  test('isOwner true/false', async () => {
    expect(
      unwrap(await suite.isOwner(DEPLOYED_SAFE_ADDRESS, account.address))
    ).toBe(true);
    const notOwner: Address = '0xcafee5b8e78900e7130a9eef940fe898c610c0f9';
    expect(unwrap(await suite.isOwner(DEPLOYED_SAFE_ADDRESS, notOwner))).toBe(
      false
    );
  });
});
