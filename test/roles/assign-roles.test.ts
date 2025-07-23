import '../setup';
import { beforeEach, describe, expect, test } from 'bun:test';
import { deploySafeWithRoles, signAndExec, expectOk } from '../utils';
import { Address, createPublicClient, PublicClient, http } from 'viem';
import { foundry } from 'viem/chains';
import { testConfig } from '../config';
import { ZodiacRolesSuite } from '../../src/lib/roles';
import { SafeContractSuite } from '../../src/lib/safe';
import { account, ROLE_KEY, ROLE_MEMBER } from '../src/constants';

describe('Assign Roles', () => {
  let SAFE_ADDRESS: Address;
  let ROLES_ADDRESS: Address;
  let safeSuite: SafeContractSuite;
  let rolesSuite: ZodiacRolesSuite;
  let publicClient: PublicClient;

  beforeEach(async () => {
    publicClient = createPublicClient({
      chain: foundry,
      transport: http(testConfig.rpcUrl),
    });

    ({
      safeAddress: SAFE_ADDRESS,
      rolesAddress: ROLES_ADDRESS,
      safeSuite: safeSuite,
      rolesSuite: rolesSuite,
    } = await deploySafeWithRoles(publicClient));
  });

  test('Assign role to member (via Safe)', async () => {
    const rolesTx = expectOk(
      await rolesSuite.buildAssignRolesTx(
        ROLES_ADDRESS,
        ROLE_MEMBER,
        [ROLE_KEY],
        [true]
      ),
      'Could not build Roles tx'
    );

    const safeTx = expectOk(
      await safeSuite.buildSignSafeTx(SAFE_ADDRESS, rolesTx.to, rolesTx.data),
      'Could not wrap in Safe tx'
    );

    await signAndExec(safeSuite, SAFE_ADDRESS, safeTx.txData, account);

    const isAssigned = expectOk(
      await rolesSuite.isModuleEnabled(ROLES_ADDRESS, ROLE_MEMBER),
      'isModuleEnabled failed'
    );

    expect(isAssigned).toBe(true);
  });
});
