import '../setup';
import { beforeEach, describe, expect, test } from 'bun:test';
import { deployAndSetupRoles, signAndExec, expectOk } from '../utils';
import {
  Address,
  createPublicClient,
  PublicClient,
  http,
  parseAbiItem,
  isAddressEqual,
} from 'viem';
import { foundry } from 'viem/chains';
import { testConfig } from '../config';
import { ZodiacRolesSuite } from '../../src/lib/roles';
import { SafeContractSuite } from '../../src/lib/safe';
import { account, ROLE_KEY, ROLE_MEMBER, TARGET } from '../src/constants';

describe('Scope Target', () => {
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
      safeSuite,
      rolesSuite,
    } = await deployAndSetupRoles(publicClient, {
      member: ROLE_MEMBER,
      roleKeys: [ROLE_KEY],
      memberOf: [true],
    }));
  });

  test('Scope role to member (via Safe)', async () => {
    const { to, data } = expectOk(
      await rolesSuite.buildScopeTargetTx(ROLES_ADDRESS, ROLE_KEY, TARGET),
      'Failed to build scopeTarget tx'
    );

    const { txData } = expectOk(
      await safeSuite.buildSignSafeTx(SAFE_ADDRESS, to, data),
      'Failed to wrap scopeTarget in Safe tx'
    );

    await signAndExec(safeSuite, SAFE_ADDRESS, txData, account);

    const logs = await publicClient.getLogs({
      address: ROLES_ADDRESS,
      event: parseAbiItem(
        'event ScopeTarget(bytes32 roleKey, address targetAddress)'
      ),
      args: {
        roleKey: ROLE_KEY,
        targetAddress: TARGET,
      },
    });

    expect(logs.length).toBe(1);
    expect(isAddressEqual(logs[0].address, ROLES_ADDRESS)).toBe(true);
  });
});
