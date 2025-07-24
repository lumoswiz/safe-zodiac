import '../setup';
import { testConfig } from '../config';
import { beforeEach, describe, expect, test } from 'bun:test';
import { SafeSuite } from '../../src';
import { account, DEPLOYED_SALT_NONCE } from '../src/constants';
import { expectOk } from '../utils';
import { createPublicClient, http, PublicClient, walletActions } from 'viem';
import { foundry } from 'viem/chains';

describe('Safe Deployment', () => {
  let publicClient: PublicClient;

  beforeEach(async () => {
    publicClient = createPublicClient({
      chain: foundry,
      transport: http(testConfig.rpcUrl),
    });
  });

  test('should deploy a Safe and verify its code', async () => {
    const suite = new SafeSuite(publicClient);

    const safeAddress = expectOk(
      await suite.calculateSafeAddress([account.address], DEPLOYED_SALT_NONCE),
      'Failed to calculate Safe address'
    );

    const isDeployed = expectOk(
      await suite.isSafeDeployed([account.address], DEPLOYED_SALT_NONCE),
      'Failed to check if Safe is deployed'
    );
    expect(isDeployed).toBe(false);

    const deploymentResult = expectOk(
      await suite.buildSafeDeploymentTx(account.address, DEPLOYED_SALT_NONCE),
      'Failed to build deployment tx'
    );

    switch (deploymentResult.kind) {
      case 'skipped':
        console.log('Deployment skipped, Safe already exists');
        return;

      case 'built': {
        const tx = deploymentResult.tx;
        break;
      }

      default:
        throw new Error(
          `Unexpected tx kind: ${(deploymentResult as any).kind}`
        );
    }

    const tx = deploymentResult.tx;

    const hash = await publicClient.extend(walletActions).sendTransaction({
      account,
      chain: null,
      to: tx.to,
      data: tx.data,
      value: BigInt(tx.value),
    });

    await publicClient.waitForTransactionReceipt({ hash });

    const code = await publicClient.getCode({ address: safeAddress });
    expect(code).not.toBe('0x');

    const threshold = expectOk(
      await suite.getThreshold(safeAddress),
      'Failed to get Safe threshold'
    );
    expect(threshold).toBe(1n);

    const owners = expectOk(
      await suite.getOwners(safeAddress),
      'Failed to get Safe owners'
    );
    expect(owners).toHaveLength(1);
    expect(owners[0]).toBe(account.address);
  });
});
