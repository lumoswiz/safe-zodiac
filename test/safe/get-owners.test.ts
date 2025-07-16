import '../setup';
import { beforeEach, describe, expect, test } from 'bun:test';
import { SafeContractSuite } from '../../src/lib/safe';
import { account, SALT_NONCE } from '../src/constants';
import { unwrap, deploySafe } from '../utils';
import { match } from '../../src/lib/utils';
import { Address, createPublicClient, PublicClient, http } from 'viem';
import { foundry } from 'viem/chains';
import { testConfig } from '../config';

describe('Owner Helpers', () => {
  let DEPLOYED_SAFE_ADDRESS: Address;
  let UNDEPLOYED_SAFE_ADDRESS: Address;
  let publicClient: PublicClient;
  let suite: SafeContractSuite;

  beforeEach(async () => {
    publicClient = createPublicClient({
      chain: foundry,
      transport: http(testConfig.rpcUrl),
    });

    suite = new SafeContractSuite(publicClient);

    ({ safeAddress: DEPLOYED_SAFE_ADDRESS, suite } = await deploySafe(
      publicClient
    ));

    UNDEPLOYED_SAFE_ADDRESS = unwrap(
      await suite.calculateSafeAddress([account.address], SALT_NONCE)
    );
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

  test('isSafeDeployed is false before deployment', async () => {
    const deployedRes = await suite.isSafeDeployed(
      [account.address],
      SALT_NONCE
    );
    await match(deployedRes, {
      ok: ({ value }) => expect(value).toBe(false),
      error: ({ error }) => {
        throw new Error(error instanceof Error ? error.message : String(error));
      },
    });
  });

  test('getOwners errors if safe not deployed', async () => {
    const ownersRes = await suite.getOwners(UNDEPLOYED_SAFE_ADDRESS);
    await match(ownersRes, {
      ok: () => {
        throw new Error(
          'Expected getOwners to error for non‑deployed Safe, but it succeeded'
        );
      },
      error: ({ error }) => {
        expect(String(error)).toMatch(
          /returned no data|no code|call exception/i
        );
      },
    });
  });
});
