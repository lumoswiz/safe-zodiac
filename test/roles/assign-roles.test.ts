import '../setup';
import { beforeEach, describe, expect, test } from 'bun:test';
import { deploySafeWithRoles, signAndExec } from '../utils';
import {
  Address,
  createPublicClient,
  PublicClient,
  http,
  walletActions,
} from 'viem';
import { foundry } from 'viem/chains';
import { testConfig } from '../config';
import { ZodiacRolesSuite } from '../../src/lib/roles';
import { SafeContractSuite } from '../../src/lib/safe';
import { account, ROLE_KEY, ROLE_MEMBER } from '../src/constants';
import { match } from '../../src/lib/utils';

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
    await match(
      await rolesSuite.buildAssignRolesTx(
        ROLES_ADDRESS,
        ROLE_MEMBER,
        [ROLE_KEY],
        [true]
      ),
      {
        error: ({ error }) => {
          throw new Error(`Could not build Roles tx: ${error}`);
        },
        ok: async ({ value: { to, data } }) => {
          await match(await safeSuite.buildSignSafeTx(SAFE_ADDRESS, to, data), {
            error: ({ error }) => {
              throw new Error(`Could not wrap in Safe tx: ${error}`);
            },
            ok: async ({ value: { txData } }) => {
              await signAndExec(safeSuite, SAFE_ADDRESS, txData, account);
            },
          });
        },
      }
    );

    await match(await rolesSuite.isModuleEnabled(ROLES_ADDRESS, ROLE_MEMBER), {
      error: ({ error }) => {
        throw new Error(`isModuleEnabled failed: ${error}`);
      },
      ok: ({ value }) => {
        expect(value).toBe(true);
      },
    });
  });
});
