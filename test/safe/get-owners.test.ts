import '../setup';
import { beforeEach, describe, expect, test } from 'bun:test';
import { SafeSuite } from '../../src';
import { account, SALT_NONCE } from '../src/constants';
import { deploySafe, expectOk } from '../utils';
import { Address, createPublicClient, PublicClient, http } from 'viem';
import { foundry } from 'viem/chains';
import { testConfig } from '../config';

describe('Owner Helpers', () => {
  let DEPLOYED_SAFE_ADDRESS: Address;
  let UNDEPLOYED_SAFE_ADDRESS: Address;
  let publicClient: PublicClient;
  let suite: SafeSuite;

  beforeEach(async () => {
    publicClient = createPublicClient({
      chain: foundry,
      transport: http(testConfig.rpcUrl),
    });

    ({ safeAddress: DEPLOYED_SAFE_ADDRESS, suite } = await deploySafe(
      publicClient
    ));

    UNDEPLOYED_SAFE_ADDRESS = expectOk(
      await suite.calculateSafeAddress([account.address], SALT_NONCE),
      'Failed to calculate undeployed Safe address'
    );
  });

  test('getOwners includes the deployer', async () => {
    const owners = expectOk(
      await suite.getOwners(DEPLOYED_SAFE_ADDRESS),
      'Failed to get owners'
    );
    expect(owners).toContain(account.address);
  });

  test('isOwner true/false', async () => {
    const isOwner = expectOk(
      await suite.isOwner(DEPLOYED_SAFE_ADDRESS, account.address),
      'Failed to check ownership for known owner'
    );
    expect(isOwner).toBe(true);

    const notOwner: Address = '0xcafee5b8e78900e7130a9eef940fe898c610c0f9';
    const isNotOwner = expectOk(
      await suite.isOwner(DEPLOYED_SAFE_ADDRESS, notOwner),
      'Failed to check ownership for non-owner'
    );
    expect(isNotOwner).toBe(false);
  });

  test('isSafeDeployed is false before deployment', async () => {
    const res = await suite.isSafeDeployed([account.address], SALT_NONCE);

    if (res.status === 'error') {
      throw new Error(`isSafeDeployed failed: ${String(res.error)}`);
    }

    expect(res.value).toBe(false);
  });

  test('getOwners errors if safe not deployed', async () => {
    const res = await suite.getOwners(UNDEPLOYED_SAFE_ADDRESS);

    if (res.status === 'ok') {
      throw new Error(
        'Expected getOwners to error for non‑deployed Safe, but it succeeded'
      );
    }

    expect(String(res.error)).toMatch(
      /returned no data|no code|call exception/i
    );
  });
});
