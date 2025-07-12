import { beforeAll, afterAll } from 'bun:test';
import {
  createPublicClient,
  createTestClient,
  http,
  TestClient,
  publicActions,
  walletActions,
} from 'viem';
import { baseSepolia, foundry } from 'viem/chains';
import { anvil } from 'prool/instances';
import { SafeContractSuite } from '../../src/lib/safe';
import { account } from '../config';
import type { Address } from 'viem';
import process from 'node:process';

export let testClient: TestClient;
export let suite: SafeContractSuite;
export let anvilInstance: ReturnType<typeof anvil>;

export const DEPLOYED_SALT_NONCE: bigint =
  59089191832082355814403076789582931186352558783567253859422031411287260031469n;
export let DEPLOYED_SAFE_ADDRESS: Address;

beforeAll(async () => {
  const forkUrl = process.env.RPC_URL!;
  anvilInstance = anvil({ port: 8545, forkUrl });
  await anvilInstance.start();

  testClient = createTestClient({
    chain: foundry,
    mode: 'anvil',
    transport: http(),
  });
  suite = new SafeContractSuite(
    createPublicClient({ chain: foundry, transport: http() })
  );

  const buildRes = await suite.buildSafeDeploymentTx(
    account.address,
    DEPLOYED_SALT_NONCE
  );
  if (buildRes.status !== 'built') {
    throw new Error('Failed to build deployment tx');
  }
  const txHash = await testClient.extend(walletActions).sendTransaction({
    account,
    chain: baseSepolia,
    to: buildRes.tx.to,
    data: buildRes.tx.data,
    value: BigInt(buildRes.tx.value),
  });
  await testClient
    .extend(publicActions)
    .waitForTransactionReceipt({ hash: txHash });

  const addrRes = await suite.calculateSafeAddress(
    [account.address],
    DEPLOYED_SALT_NONCE
  );
  if (addrRes.status !== 'ok') {
    throw new Error('Failed to calculate DEPLOYED_SAFE_ADDRESS');
  }
  DEPLOYED_SAFE_ADDRESS = addrRes.value;
});

afterAll(async () => {
  if (anvilInstance) {
    await anvilInstance.stop();
  }
});
