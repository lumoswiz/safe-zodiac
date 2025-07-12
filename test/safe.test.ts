import { describe, it, expect, afterAll, beforeAll } from 'bun:test';
import {
  createPublicClient,
  createTestClient,
  Hex,
  http,
  publicActions,
  TestClient,
  walletActions,
} from 'viem';
import { foundry } from 'viem/chains';
import { account } from './config';
import { SALT_NONCE } from './constants';
import { SafeContractSuite } from '../src/lib/safe';
import { match } from '../src/lib/utils';
import { unwrap } from './test-utils';
import { anvil } from 'prool/instances';

describe('SafeContractSuite', () => {
  let anvilInstance: ReturnType<typeof anvil>;
  let client: TestClient;
  let suite: SafeContractSuite;

  beforeAll(async () => {
    const forkUrl = process.env.RPC_URL;
    if (!forkUrl) throw new Error('Missing RPC_URL in env!');
    anvilInstance = anvil({ port: 8545, forkUrl });
    await anvilInstance.start();

    client = createTestClient({
      chain: foundry,
      mode: 'anvil',
      transport: http(),
    });

    suite = new SafeContractSuite(
      createPublicClient({
        chain: foundry,
        transport: http(),
      })
    );
  });

  afterAll(async () => {
    await anvilInstance.stop();
  });

  it('returns false if Safe not deployed', async () => {
    const deployedRes = await suite.isSafeDeployed(
      [account.address],
      SALT_NONCE
    );
    expect(unwrap(deployedRes)).toBe(false);
  });

  it('buildSafeDeploymentTx: returns "built" when Safe not deployed', async () => {
    const result = await suite.buildSafeDeploymentTx(
      account.address,
      SALT_NONCE
    );

    match(result, {
      built: ({ tx }) => {
        expect(tx.to).toBeDefined();
        expect(tx.data).toBeDefined();
        expect(tx.value).toBe('0x0');
      },
      skipped: () => {
        throw new Error('Expected status to be "built", but was "skipped"');
      },
    });
  });

  it('can deploy a Safe by sending the built tx', async () => {
    const result = await suite.buildSafeDeploymentTx(
      account.address,
      SALT_NONCE
    );

    match(result, {
      built: async ({ tx }) => {
        const hash = await client.extend(walletActions).sendTransaction({
          account,
          chain: foundry,
          to: tx.to,
          data: tx.data as Hex,
          value: BigInt(tx.value),
        });

        expect(hash).toBeDefined();

        await client.extend(publicActions).waitForTransactionReceipt({ hash });

        const isDeployedRes = await suite.isSafeDeployed(
          [account.address],
          SALT_NONCE
        );
        expect(unwrap(isDeployedRes)).toBe(true);
      },
      skipped: () => {
        throw new Error('Safe already deployed; expected "built" tx');
      },
    });
  });

  it('skips building tx if Safe bytecode is already present', async () => {
    const addrRes = await suite.calculateSafeAddress(
      [account.address],
      SALT_NONCE
    );
    const safeAddr = unwrap(addrRes);

    const dummyBytecode = '0x3d604052';
    await client.setCode({
      address: safeAddr,
      bytecode: dummyBytecode,
    });

    const result = await suite.buildSafeDeploymentTx(
      account.address,
      SALT_NONCE
    );

    match(result, {
      built: () => {
        throw new Error('Expected status to be "skipped", but was "built"');
      },
      skipped: () => {
        expect(true).toBe(true);
      },
    });
  });
});
