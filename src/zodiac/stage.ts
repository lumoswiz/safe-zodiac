import { Address, Hex } from 'viem';
import { fetchRoleFromSubgraph } from '../roles/subgraph';
import { makeError, makeOk, matchResult } from '../shared/utils';
import {
  DetermineStartStageArgs,
  RoleSubgraphStatus,
  SetupStage,
} from '@sdk/types';
import { DEFAULT_ROLES_NONCE } from './constants';
import { SafeSuite } from '../safe';
import { RolesSuite } from '../roles/suite';
import { SubgraphRole } from 'types/subgraph';

export async function determineStartStage({
  safeSuite,
  rolesSuite,
  context,
  config,
  chainId,
}: DetermineStartStageArgs) {
  const { safeAddress, deployed } = context;
  const rolesSetup = config.rolesSetup;
  const rolesNonce = config.rolesNonce ?? DEFAULT_ROLES_NONCE;

  if (!deployed) return makeOk(SetupStage.DeploySafe);

  const moduleDeployed = await isRolesModuleDeployed(
    rolesSuite,
    safeAddress,
    rolesNonce
  );
  if (!moduleDeployed) return makeOk(SetupStage.DeployModule);

  if (!rolesSetup) return makeOk(SetupStage.NothingToDo);

  const moduleAddress = await getModuleAddress(
    rolesSuite,
    safeAddress,
    rolesNonce
  );

  const enabled = await isModuleEnabled(safeSuite, safeAddress, moduleAddress);
  if (!enabled) return makeOk(SetupStage.EnableModule);

  if (!rolesSetup.roleKey) {
    return makeError(
      new Error('Missing `roleKey`: required to check role state in subgraph.')
    );
  }

  const role = await fetchRoleFromSubgraph(
    chainId,
    moduleAddress,
    rolesSetup.roleKey
  );
  if (!role || !rolesSetup.member) return makeOk(SetupStage.AssignRoles);

  const status = getRoleSubgraphStatus(
    role,
    rolesSetup.member,
    rolesSetup.target ?? '0x0000000000000000000000000000000000000000',
    rolesSetup.scopes?.flatMap((s) => s.selectors) ?? []
  );

  if (!status.assignedToMember) return makeOk(SetupStage.AssignRoles);
  if (!status.targetScoped) return makeOk(SetupStage.ScopeTarget);
  if (!status.selectorsScoped) return makeOk(SetupStage.ScopeFunctions);

  return makeOk(SetupStage.NothingToDo);
}

async function isRolesModuleDeployed(
  rolesSuite: RolesSuite,
  safe: Address,
  nonce: bigint
): Promise<boolean> {
  const res = await rolesSuite.isModuleDeployed(safe, nonce);
  return matchResult(res, {
    ok: ({ value }) => value,
    error: ({ error }) => Promise.reject(error),
  });
}

async function getModuleAddress(
  rolesSuite: RolesSuite,
  safe: Address,
  nonce: bigint
): Promise<Address> {
  const res = rolesSuite.calculateModuleProxyAddress(safe, nonce);
  return matchResult(res, {
    ok: ({ value }) => value,
    error: ({ error }) => Promise.reject(error),
  });
}

async function isModuleEnabled(
  safeSuite: SafeSuite,
  safe: Address,
  module: Address
): Promise<boolean> {
  const res = await safeSuite.isModuleEnabled(safe, module);
  return matchResult(res, {
    ok: ({ value }) => value,
    error: ({ error }) => Promise.reject(error),
  });
}

function getRoleSubgraphStatus(
  role: SubgraphRole,
  member: Address,
  target: Address,
  selectors: Hex[]
): RoleSubgraphStatus {
  const assigned = role.members.length > 0;

  const assignedToMember = role.members.some(
    (m) => m.address.toLowerCase() === member.toLowerCase()
  );

  const scopedTarget = role.targets.find(
    (t) => t.address.toLowerCase() === target.toLowerCase()
  );

  const targetScoped = !!scopedTarget;

  const scopedSelectors = new Set(
    scopedTarget?.functions.map((f) => f.selector.toLowerCase()) ?? []
  );

  const normalizedSelectors = selectors.map((s) => s.toLowerCase());
  const missing = normalizedSelectors.filter(
    (sel) => !scopedSelectors.has(sel)
  );

  return {
    assigned,
    assignedToMember,
    targetScoped,
    selectorsScoped: missing.length === 0,
    missingSelectors: missing.length > 0 ? (missing as Hex[]) : undefined,
  };
}
