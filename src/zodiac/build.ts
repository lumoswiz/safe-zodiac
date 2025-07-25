import { Address } from 'viem';
import {
  BuildInitialSetupArgs,
  BuildTxBucketsResult,
  EnsureModuleEnabledResult,
  EnsureRolesResult,
  ExecutionOptions,
  MetaTransactionData,
  PartialRolesSetupArgs,
  ResolvedSafeContext,
  RoleScope,
  RolesSetupArgs,
  RolesSetupConfig,
  SetupStage,
  TxBuildOptions,
} from '../types';
import {
  expectBuiltTx,
  makeError,
  makeOk,
  matchResult,
  maybeBuiltTx,
} from '../shared/utils';
import { SafeSuite } from '../safe';
import { RolesSuite } from '../roles/suite';
import { DEFAULT_ROLES_NONCE } from './constants';

export async function buildAllTx(
  safeSuite: SafeSuite,
  rolesSuite: RolesSuite,
  context: ResolvedSafeContext,
  owner: Address,
  config: RolesSetupConfig,
  options: TxBuildOptions
): Promise<BuildTxBucketsResult> {
  const { safeAddress, saltNonce, deployed } = context;
  const rolesNonce = config.rolesNonce ?? DEFAULT_ROLES_NONCE;

  if (!deployed) {
    const allBuckets = await buildInitialSetupTxs({
      safeSuite,
      rolesSuite,
      safeAddress,
      owner,
      safeNonce: saltNonce,
      config,
      options,
      startAt: SetupStage.DeploySafe,
    });

    return makeOk(allBuckets);
  }

  const setupTxs: MetaTransactionData[] = [];
  const multisendTxs: MetaTransactionData[] = [];

  const rolesRes = await ensureRolesModule(rolesSuite, safeAddress, rolesNonce);
  const { rolesAddress, metaTxs: rolesTxs } = await matchResult(rolesRes, {
    ok: ({ value }) => value,
    error: ({ error }) => Promise.reject(error),
  });

  setupTxs.push(...rolesTxs);

  if (rolesTxs.length > 0) {
    const extra = await buildInitialSetupTxs({
      safeSuite,
      rolesSuite,
      safeAddress,
      owner,
      safeNonce: saltNonce ?? 0n,
      config,
      options,
      startAt: SetupStage.EnableModule,
    });

    setupTxs.push(...extra.setupTxs);
    multisendTxs.push(...extra.multisendTxs);
    return makeOk({ setupTxs, multisendTxs });
  }

  const enableRes = await ensureModuleEnabled(
    safeSuite,
    safeAddress,
    rolesAddress
  );
  const enableVal = await matchResult(enableRes, {
    ok: ({ value }) => value,
    error: ({ error }) => Promise.reject(error),
  });

  multisendTxs.push(...enableVal.metaTxs);

  if (enableVal.metaTxs.length > 0) {
    const extra = await buildInitialSetupTxs({
      safeSuite,
      rolesSuite,
      safeAddress,
      owner,
      safeNonce: saltNonce ?? 0n,
      config,
      options,
      startAt: SetupStage.AssignRoles,
    });

    multisendTxs.push(...extra.multisendTxs);
    return makeOk({ setupTxs, multisendTxs });
  }

  return makeOk({ setupTxs, multisendTxs });
}

export function validateSetupArgs(
  startAt: SetupStage,
  setup?: PartialRolesSetupArgs
) {
  if (startAt <= SetupStage.ScopeFunctions && !setup) {
    throw new Error('Missing rolesSetup');
  }

  if (startAt <= SetupStage.AssignRoles) {
    if (!setup?.member) throw new Error('AssignRoles requires `member`');
    if (!setup?.roleKey) throw new Error('AssignRoles requires `roleKey`');
  }

  if (startAt <= SetupStage.ScopeTarget) {
    if (!setup?.target) throw new Error('ScopeTarget requires `target`');
  }

  if (startAt <= SetupStage.ScopeFunctions) {
    if (!setup?.scopes) throw new Error('ScopeFunctions requires `scopes`');
  }
}

export async function buildInitialSetupTxs(
  args: BuildInitialSetupArgs
): Promise<{
  setupTxs: MetaTransactionData[];
  multisendTxs: MetaTransactionData[];
}> {
  const rolesNonce = args.config.rolesNonce ?? DEFAULT_ROLES_NONCE;
  const rolesSetup = args.config.rolesSetup;
  validateSetupArgs(args.startAt, rolesSetup);
  const setupTxs: MetaTransactionData[] = [];
  const multisendTxs: MetaTransactionData[] = [];

  const addrResult = args.rolesSuite.calculateModuleProxyAddress(
    args.safeAddress,
    rolesNonce
  );

  const rolesAddress = await matchResult(addrResult, {
    ok: ({ value }) => value,
    error: ({ error }) => Promise.reject(error),
  });

  const steps: Record<SetupStage, () => Promise<void>> = {
    [SetupStage.DeploySafe]: async () => {
      setupTxs.push(
        await buildSafeDeployTx(args.safeSuite, args.owner, args.safeNonce)
      );
    },
    [SetupStage.DeployModule]: async () => {
      setupTxs.push(
        await buildRolesDeployTx(args.rolesSuite, args.safeAddress, rolesNonce)
      );
    },
    [SetupStage.EnableModule]: async () => {
      multisendTxs.push(
        await args.safeSuite.buildRawEnableModuleMetaTx(
          args.safeAddress,
          rolesAddress
        )
      );
    },
    [SetupStage.AssignRoles]: async () => {
      if (!rolesSetup?.member || !rolesSetup?.roleKey) {
        throw new Error('member and roleKey required for AssignRoles');
      }
      multisendTxs.push(
        await buildAssignRolesTx(
          args.rolesSuite,
          rolesAddress,
          rolesSetup as RolesSetupArgs
        )
      );
    },
    [SetupStage.ScopeTarget]: async () => {
      if (!rolesSetup?.target || !rolesSetup?.roleKey) {
        throw new Error('target and roleKey required for ScopeTarget');
      }
      multisendTxs.push(
        await buildScopeTargetTx(
          args.rolesSuite,
          rolesAddress,
          rolesSetup as RolesSetupArgs
        )
      );
    },
    [SetupStage.ScopeFunctions]: async () => {
      if (!rolesSetup?.scopes || !rolesSetup?.target || !rolesSetup?.roleKey) {
        throw new Error(
          'scopes, target, and roleKey required for ScopeFunctions'
        );
      }
      for (const s of rolesSetup.scopes) {
        multisendTxs.push(
          await buildScopeFunctionTx(
            args.rolesSuite,
            rolesAddress,
            rolesSetup as RolesSetupArgs,
            s
          )
        );
      }
    },
  };

  for (let stage = args.startAt; stage <= SetupStage.ScopeFunctions; stage++) {
    await steps[stage]();
  }

  setupTxs.push(...(args.options.extraSetupTxs || []));
  multisendTxs.push(...(args.options.extraMultisendTxs || []));

  return { setupTxs, multisendTxs };
}

export async function buildSafeDeployTx(
  safeSuite: SafeSuite,
  owner: Address,
  nonce: bigint
): Promise<MetaTransactionData> {
  return expectBuiltTx(
    safeSuite.buildSafeDeploymentTx(owner, nonce),
    'Safe deployment'
  );
}

export async function buildRolesDeployTx(
  rolesSuite: RolesSuite,
  safeAddr: Address,
  nonce: bigint
): Promise<MetaTransactionData> {
  return expectBuiltTx(
    rolesSuite.buildDeployModuleTx(safeAddr, nonce),
    'Roles module deployment'
  );
}

export async function buildAssignRolesTx(
  rolesSuite: RolesSuite,
  moduleAddr: Address,
  setup: RolesSetupArgs
): Promise<MetaTransactionData> {
  const result = await rolesSuite.buildAssignRolesTx(
    moduleAddr,
    setup.member,
    [setup.roleKey],
    [true]
  );

  return matchResult(result, {
    ok: ({ value }) => value,
    error: ({ error }) => Promise.reject(error),
  });
}

export async function buildScopeTargetTx(
  rolesSuite: RolesSuite,
  moduleAddr: Address,
  setup: RolesSetupArgs
): Promise<MetaTransactionData> {
  const result = await rolesSuite.buildScopeTargetTx(
    moduleAddr,
    setup.roleKey,
    setup.target
  );

  return matchResult(result, {
    ok: ({ value }) => value,
    error: ({ error }) => Promise.reject(error),
  });
}

export async function buildScopeFunctionTx(
  rolesSuite: RolesSuite,
  moduleAddr: Address,
  setup: RolesSetupArgs,
  scope: RoleScope
): Promise<MetaTransactionData> {
  const result = await rolesSuite.buildScopeFunctionTx(
    moduleAddr,
    setup.roleKey,
    setup.target,
    scope.selectors,
    scope.conditions,
    scope.execOpts ?? ExecutionOptions.Send
  );

  return matchResult(result, {
    ok: ({ value }) => value,
    error: ({ error }) => Promise.reject(error),
  });
}

export async function ensureModuleEnabled(
  safeSuite: SafeSuite,
  safe: Address,
  module: Address
): Promise<EnsureModuleEnabledResult> {
  const enabledRes = await safeSuite.isModuleEnabled(safe, module);

  const isEnabled = await matchResult(enabledRes, {
    ok: ({ value }) => value,
    error: ({ error }) => Promise.reject(error),
  });

  if (isEnabled) {
    return makeOk({ metaTxs: [] });
  }

  const buildRes = await safeSuite.buildEnableModuleTx(safe, module);

  const txResult = await matchResult(buildRes, {
    ok: ({ value: { txData } }) => makeOk(txData),
    error: ({ error }) => makeError(error),
  });

  return matchResult(txResult, {
    ok: ({ value }) => makeOk({ metaTxs: [value as MetaTransactionData] }),
    error: ({ error }) => makeError(error),
  });
}

export async function ensureRolesModule(
  rolesSuite: RolesSuite,
  safe: Address,
  rolesNonce: bigint = DEFAULT_ROLES_NONCE
): Promise<EnsureRolesResult> {
  const addrResult = rolesSuite.calculateModuleProxyAddress(safe, rolesNonce);

  const rolesAddress = await matchResult(addrResult, {
    ok: ({ value }) => value,
    error: ({ error }) => Promise.reject(error),
  });

  const deployedResult = await rolesSuite.isModuleDeployed(safe, rolesNonce);

  const isDeployed = await matchResult(deployedResult, {
    ok: ({ value }) => value,
    error: ({ error }) => Promise.reject(error),
  });

  if (isDeployed) {
    return makeOk({ rolesAddress, metaTxs: [] });
  }

  const maybeTx = await maybeBuiltTx(
    rolesSuite.buildDeployModuleTx(safe, rolesNonce)
  );

  return makeOk({ rolesAddress, metaTxs: maybeTx ? [maybeTx] : [] });
}
