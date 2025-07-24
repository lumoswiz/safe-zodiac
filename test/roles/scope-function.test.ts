import '../setup';
import { beforeEach, describe, expect, test } from 'bun:test';
import { deployAndSetupRoles, signAndExec, expectOk } from '../utils';
import {
  Address,
  createPublicClient,
  PublicClient,
  http,
  encodeAbiParameters,
  parseAbiParameters,
  parseAbiItem,
} from 'viem';
import { foundry } from 'viem/chains';
import { testConfig } from '../config';
import { SafeSuite, RolesSuite } from '../../src';
import {
  account,
  ROLE_KEY,
  ROLE_MEMBER,
  SUPPLY_SELECTOR,
  TARGET,
  WETH,
} from '../src/constants';
import {
  ConditionFlat,
  ExecutionOptions,
  ParameterType,
  Operator,
} from '../../src/types';

describe('Scope Function', () => {
  let SAFE_ADDRESS: Address;
  let ROLES_ADDRESS: Address;
  let safeSuite: SafeSuite;
  let rolesSuite: RolesSuite;
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

    const { to, data } = expectOk(
      await rolesSuite.buildScopeTargetTx(ROLES_ADDRESS, ROLE_KEY, TARGET),
      'Failed to build scopeTarget tx'
    );

    const { txData } = expectOk(
      await safeSuite.buildSignSafeTx(SAFE_ADDRESS, to, data),
      'Failed to wrap scopeTarget in Safe tx'
    );

    await signAndExec(safeSuite, SAFE_ADDRESS, txData, account);
  });

  test('Safe signed “scopeFunction” call locks `POOL.supply()` behind ROLE_KEY', async () => {
    const conditions: ConditionFlat[] = [
      {
        parent: 0,
        paramType: ParameterType.Calldata,
        operator: Operator.Matches,
        compValue: '0x',
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: encodeAbiParameters(parseAbiParameters('address'), [WETH]),
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: '0x',
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.EqualTo,
        compValue: encodeAbiParameters(parseAbiParameters('address'), [
          account.address,
        ]),
      },
      {
        parent: 0,
        paramType: ParameterType.Static,
        operator: Operator.Pass,
        compValue: '0x',
      },
    ];

    const { to, data } = expectOk(
      await rolesSuite.buildScopeFunctionTx(
        ROLES_ADDRESS,
        ROLE_KEY,
        TARGET,
        SUPPLY_SELECTOR,
        conditions,
        ExecutionOptions.Send
      ),
      'Failed to build scopeFunction tx'
    );

    const { txData } = expectOk(
      await safeSuite.buildSignSafeTx(SAFE_ADDRESS, to, data),
      'Failed to wrap scopeFunction in Safe tx'
    );

    await signAndExec(safeSuite, SAFE_ADDRESS, txData, account);

    const scopeFnEvent = parseAbiItem(
      `event ScopeFunction(bytes32, address, bytes4, (uint8,uint8,uint8,bytes)[], uint8)`
    );

    const logs = await publicClient.getLogs({
      address: ROLES_ADDRESS,
      event: scopeFnEvent,
    });

    expect(logs.length).toBe(1);
  });
});
