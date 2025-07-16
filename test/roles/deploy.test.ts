import '../setup';
import { beforeEach, describe, expect, test } from 'bun:test';
import { deploySafe, deployRoles } from '../utils';
import { Address, createPublicClient, PublicClient, http } from 'viem';
import { foundry } from 'viem/chains';
import { testConfig } from '../config';
import { ZodiacRolesSuite } from '../../src/lib/roles';

describe('Roles Deployment', () => {
  let SAFE_ADDRESS: Address;
  let ROLES_ADDRESS: Address;
  let rolesSuite: ZodiacRolesSuite;
  let publicClient: PublicClient;

  beforeEach(async () => {
    publicClient = createPublicClient({
      chain: foundry,
      transport: http(testConfig.rpcUrl),
    });

    ({ safeAddress: SAFE_ADDRESS } = await deploySafe(publicClient));

    ({ rolesAddress: ROLES_ADDRESS, suite: rolesSuite } = await deployRoles(
      publicClient,
      SAFE_ADDRESS
    ));
  });

  test('Roles module bytecode exists', async () => {
    const code = await publicClient.getCode({ address: ROLES_ADDRESS });
    expect(code).not.toBe('0x');
  });
});
