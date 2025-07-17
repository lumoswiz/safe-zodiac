import {
  Address,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  Hex,
  isAddressEqual,
  PublicClient,
} from 'viem';
import { SafeContractSuite } from './lib/safe';
import { ZodiacRolesSuite } from './lib/roles';
import {
  GetOwnersResult,
  IsValidSafeResult,
  MetaTransactionData,
  Result,
  EnsureSafeResult,
  BuildTxResult,
  EnsureRolesResult,
  IsModuleDeployedResult,
  CalculateModuleProxyAddressResult,
  BuildTxBucketsResult,
  ExecutionOptions,
  RolesSetupArgs,
  BuildSignSafeTx,
  BuildMetaTxResult,
  RoleScope,
  SetupStage,
  PartialRolesSetupArgs,
  CalculateSafeAddressResult,
  EnsureModuleEnabledResult,
  IsModuleEnabledResult,
} from './types';
import { expectValue, match, maybeError, unwrapOrFail } from './lib/utils';
import { fetchRole } from './lib/subgraph';

export class ZodiacSafeSuite {
  readonly client: PublicClient;
  readonly safeSuite: SafeContractSuite;
  readonly rolesSuite: ZodiacRolesSuite;
  private static readonly DEFAULT_ROLES_NONCE: bigint =
    46303759331860629381431170770107494699648271559618626860680275899814502026071n;

  constructor(publicClient: PublicClient) {
    this.client = publicClient;
    this.safeSuite = new SafeContractSuite(publicClient);
    this.rolesSuite = new ZodiacRolesSuite(publicClient);
  }

  private async buildAllTx(
    safe: Address | undefined,
    owner: Address,
    safeNonce: bigint,
    rolesSetup: PartialRolesSetupArgs = {},
    rolesNonce: bigint = ZodiacSafeSuite.DEFAULT_ROLES_NONCE
  ): Promise<BuildTxBucketsResult> {
    if (!safe) {
      const predicted: Address = await expectValue(
        this.safeSuite.calculateSafeAddress([owner], safeNonce).then((res) =>
          match<CalculateSafeAddressResult, Result<Address>>(res, {
            ok: ({ value }) => ({ status: 'ok', value }),
            error: ({ error }) => ({ status: 'error', error }),
          })
        )
      );

      const allBuckets = await this.buildInitialSetupTxs(
        predicted,
        owner,
        safeNonce,
        rolesNonce,
        rolesSetup,
        SetupStage.DeploySafe
      );
      return { status: 'ok', value: allBuckets };
    }

    const safeRes = await this.ensureSingleOwnerSafe(safe, owner, safeNonce);
    const safeVal = unwrapOrFail(safeRes);
    if (maybeError(safeVal)) return { status: 'error', error: safeVal };

    const { safeAddress, metaTxs: safeTxs } = safeVal;

    const setupTxs: MetaTransactionData[] = [...safeTxs];
    const multisendTxs: MetaTransactionData[] = [];

    if (safeTxs.length > 0) {
      const extra = await this.buildInitialSetupTxs(
        safeAddress,
        owner,
        safeNonce,
        rolesNonce,
        rolesSetup,
        SetupStage.DeployModule
      );
      setupTxs.push(...extra.setupTxs);
      multisendTxs.push(...extra.multisendTxs);
      return { status: 'ok', value: { setupTxs, multisendTxs } };
    }

    const rolesRes = await this.ensureRolesModule(safeAddress, rolesNonce);
    const rolesVal = unwrapOrFail(rolesRes);
    if (maybeError(rolesVal)) return { status: 'error', error: rolesVal };

    const { rolesAddress, metaTxs: rolesTxs } = rolesVal;

    setupTxs.push(...rolesTxs);

    if (rolesTxs.length > 0) {
      const extra = await this.buildInitialSetupTxs(
        safeAddress,
        owner,
        safeNonce,
        rolesNonce,
        rolesSetup,
        SetupStage.EnableModule
      );
      setupTxs.push(...extra.setupTxs);
      multisendTxs.push(...extra.multisendTxs);
      return { status: 'ok', value: { setupTxs, multisendTxs } };
    }

    const enableRes = await this.ensureModuleEnabled(safeAddress, rolesAddress);
    const enableVal = unwrapOrFail(enableRes);
    if (maybeError(enableVal)) return { status: 'error', error: enableVal };

    const enableTxs = enableVal.metaTxs;
    multisendTxs.push(...enableTxs);

    if (enableTxs.length > 0) {
      const extra = await this.buildInitialSetupTxs(
        safeAddress,
        owner,
        safeNonce,
        rolesNonce,
        rolesSetup,
        SetupStage.AssignRoles
      );
      multisendTxs.push(...extra.multisendTxs);
      return { status: 'ok', value: { setupTxs, multisendTxs } };
    }

    // Add to here later
    return { status: 'ok', value: { setupTxs, multisendTxs } };
  }

  private async ensureSingleOwnerSafe(
    safe: Address | undefined,
    owner: Address,
    safeNonce: bigint
  ): Promise<EnsureSafeResult> {
    const resolved =
      safe ??
      unwrapOrFail(
        await this.safeSuite.calculateSafeAddress([owner], safeNonce)
      );
    if (maybeError(resolved)) {
      return { status: 'error', error: resolved };
    }

    const validityRes = await match<IsValidSafeResult, Result<boolean>>(
      await this.isValidSafe(resolved, owner),
      {
        ok: ({ value }) => ({ status: 'ok', value }),
        error: ({ error }) => {
          if (
            error instanceof ContractFunctionRevertedError ||
            error instanceof ContractFunctionExecutionError
          ) {
            return { status: 'ok', value: false };
          }
          return { status: 'error', error };
        },
      }
    );

    const isValid = unwrapOrFail(validityRes);
    if (maybeError(isValid)) {
      return { status: 'error', error: isValid };
    }

    if (!isValid) {
      const deployRes = await this.safeSuite.buildSafeDeploymentTx(
        owner,
        safeNonce
      );

      const errOrTx = await match<
        BuildTxResult,
        null | MetaTransactionData | unknown
      >(deployRes, {
        built: ({ tx }) => tx,
        skipped: () => null,
        error: ({ error }) => error,
      });

      if (errOrTx && typeof errOrTx !== 'object') {
        return { status: 'error', error: errOrTx };
      }

      const metaTxs = errOrTx ? [errOrTx as MetaTransactionData] : [];
      return { status: 'ok', value: { safeAddress: resolved, metaTxs } };
    }

    return { status: 'ok', value: { safeAddress: resolved, metaTxs: [] } };
  }

  private async isValidSafe(
    safe: Address,
    owner: Address
  ): Promise<IsValidSafeResult> {
    return match<GetOwnersResult, IsValidSafeResult>(
      await this.safeSuite.getOwners(safe),
      {
        ok: ({ value: owners }) => {
          const [onlyOwner] = owners;
          if (!onlyOwner || owners.length !== 1) {
            return { status: 'ok', value: false };
          }
          return {
            status: 'ok',
            value: isAddressEqual(owner, onlyOwner),
          };
        },
        error: ({ error }) => ({ status: 'error', error }),
      }
    );
  }

  private async ensureRolesModule(
    safe: Address,
    rolesNonce: bigint = ZodiacSafeSuite.DEFAULT_ROLES_NONCE
  ): Promise<EnsureRolesResult> {
    const addrRes = await match<
      CalculateModuleProxyAddressResult,
      Result<Address>
    >(this.rolesSuite.calculateModuleProxyAddress(safe, rolesNonce), {
      ok: ({ value }) => ({ status: 'ok', value }),
      error: ({ error }) => ({ status: 'error', error }),
    });

    const rolesAddress = unwrapOrFail(addrRes);
    if (maybeError(rolesAddress))
      return { status: 'error', error: rolesAddress };

    const deployedRes = await match<IsModuleDeployedResult, Result<boolean>>(
      await this.rolesSuite.isModuleDeployed(safe, rolesNonce),
      {
        ok: ({ value }) => ({ status: 'ok', value }),
        error: ({ error }) => ({ status: 'error', error }),
      }
    );

    const isDeployed = unwrapOrFail(deployedRes);
    if (maybeError(isDeployed)) return { status: 'error', error: isDeployed };

    if (isDeployed) {
      return { status: 'ok', value: { rolesAddress, metaTxs: [] } };
    }

    const buildRes = await match<
      BuildTxResult,
      Result<MetaTransactionData | null>
    >(await this.rolesSuite.buildDeployModuleTx(safe, rolesNonce), {
      built: ({ tx }) => ({ status: 'ok', value: tx }),
      skipped: () => ({ status: 'ok', value: null }),
      error: ({ error }) => ({ status: 'error', error }),
    });

    const txOrNull = unwrapOrFail(buildRes);
    if (maybeError(txOrNull)) return { status: 'error', error: txOrNull };

    const metaTxs = txOrNull ? [txOrNull] : [];
    return { status: 'ok', value: { rolesAddress, metaTxs } };
  }

  private async buildInitialSetupTxs(
    safeAddress: Address,
    owner: Address,
    safeNonce: bigint,
    rolesNonce: bigint,
    rolesSetup: PartialRolesSetupArgs = {},
    startAt: SetupStage
  ): Promise<{
    setupTxs: MetaTransactionData[];
    multisendTxs: MetaTransactionData[];
  }> {
    const setupTxs: MetaTransactionData[] = [];
    const multisendTxs: MetaTransactionData[] = [];

    const rolesAddress = await expectValue(
      match<CalculateModuleProxyAddressResult, Result<Address>>(
        this.rolesSuite.calculateModuleProxyAddress(safeAddress, rolesNonce),
        {
          ok: ({ value }) => ({ status: 'ok', value }),
          error: ({ error }) => ({ status: 'error', error }),
        }
      )
    );

    type StepFn = () => Promise<void>;

    const steps: Record<SetupStage, StepFn> = {
      [SetupStage.DeploySafe]: async () => {
        setupTxs.push(await this.buildSafeDeployTx(owner, safeNonce));
      },
      [SetupStage.DeployModule]: async () => {
        const tx = await this.buildRolesDeployTx(safeAddress, rolesNonce);
        if (tx) setupTxs.push(tx);
      },
      [SetupStage.EnableModule]: async () => {
        multisendTxs.push(
          await this.buildEnableModuleTx(safeAddress, rolesAddress)
        );
      },
      [SetupStage.AssignRoles]: async () => {
        if (!rolesSetup.member || !rolesSetup.roleKey) {
          throw new Error('member and roleKey required for AssignRoles');
        }
        multisendTxs.push(
          await this.buildAssignRolesTx(
            rolesAddress,
            rolesSetup as RolesSetupArgs
          )
        );
      },
      [SetupStage.ScopeTarget]: async () => {
        if (!rolesSetup.target || !rolesSetup.roleKey) {
          throw new Error('target and roleKey required for ScopeTarget');
        }
        multisendTxs.push(
          await this.buildScopeTargetTx(
            rolesAddress,
            rolesSetup as RolesSetupArgs
          )
        );
      },
      [SetupStage.ScopeFunctions]: async () => {
        if (!rolesSetup.scopes || !rolesSetup.target || !rolesSetup.roleKey) {
          throw new Error(
            'scopes, target, and roleKey required for ScopeFunctions'
          );
        }
        for (const s of rolesSetup.scopes) {
          multisendTxs.push(
            await this.buildScopeFunctionTx(
              rolesAddress,
              rolesSetup as RolesSetupArgs,
              s
            )
          );
        }
      },
    };

    for (let stage = startAt; stage <= SetupStage.ScopeFunctions; stage++) {
      await steps[stage]();
    }

    return { setupTxs, multisendTxs };
  }

  private async buildSafeDeployTx(
    owner: Address,
    nonce: bigint
  ): Promise<MetaTransactionData> {
    return expectValue(
      match<BuildTxResult, Result<MetaTransactionData>>(
        await this.safeSuite.buildSafeDeploymentTx(owner, nonce),
        {
          built: ({ tx }) => ({ status: 'ok', value: tx }),
          skipped: () => ({ status: 'error', error: 'unexpected skip' }),
          error: ({ error }) => ({ status: 'error', error }),
        }
      )
    );
  }

  private async buildRolesDeployTx(
    safeAddr: Address,
    nonce: bigint
  ): Promise<MetaTransactionData | null> {
    return expectValue(
      match<BuildTxResult, Result<MetaTransactionData | null>>(
        await this.rolesSuite.buildDeployModuleTx(safeAddr, nonce),
        {
          built: ({ tx }) => ({ status: 'ok', value: tx }),
          skipped: () => ({ status: 'ok', value: null }),
          error: ({ error }) => ({ status: 'error', error }),
        }
      )
    );
  }

  private async buildEnableModuleTx(
    safeAddr: Address,
    moduleAddr: Address
  ): Promise<MetaTransactionData> {
    return expectValue(
      match<BuildSignSafeTx, Result<MetaTransactionData>>(
        await this.safeSuite.buildEnableModuleTx(safeAddr, moduleAddr),
        {
          ok: ({ value: { txData } }) => ({ status: 'ok', value: txData }),
          error: ({ error }) => ({ status: 'error', error }),
        }
      )
    );
  }

  private async buildAssignRolesTx(
    moduleAddr: Address,
    setup: RolesSetupArgs
  ): Promise<MetaTransactionData> {
    return expectValue(
      match<BuildMetaTxResult, Result<MetaTransactionData>>(
        await this.rolesSuite.buildAssignRolesTx(
          moduleAddr,
          setup.member,
          [setup.roleKey],
          [true]
        ),
        {
          ok: ({ value }) => ({ status: 'ok', value }),
          error: ({ error }) => ({ status: 'error', error }),
        }
      )
    );
  }

  private async buildScopeTargetTx(
    moduleAddr: Address,
    setup: RolesSetupArgs
  ): Promise<MetaTransactionData> {
    return expectValue(
      match<BuildMetaTxResult, Result<MetaTransactionData>>(
        await this.rolesSuite.buildScopeTargetTx(
          moduleAddr,
          setup.roleKey,
          setup.target
        ),
        {
          ok: ({ value }) => ({ status: 'ok', value }),
          error: ({ error }) => ({ status: 'error', error }),
        }
      )
    );
  }

  private async buildScopeFunctionTx(
    moduleAddr: Address,
    setup: RolesSetupArgs,
    scope: RoleScope
  ): Promise<MetaTransactionData> {
    return expectValue(
      match<BuildMetaTxResult, Result<MetaTransactionData>>(
        await this.rolesSuite.buildScopeFunctionTx(
          moduleAddr,
          setup.roleKey,
          setup.target,
          scope.selectors,
          scope.conditions,
          scope.execOpts ?? ExecutionOptions.Send
        ),
        {
          ok: ({ value }) => ({ status: 'ok', value }),
          error: ({ error }) => ({ status: 'error', error }),
        }
      )
    );
  }

  private async ensureModuleEnabled(
    safe: Address,
    module: Address
  ): Promise<EnsureModuleEnabledResult> {
    const enabledRes = await match<IsModuleEnabledResult, Result<boolean>>(
      await this.safeSuite.isModuleEnabled(safe, module),
      {
        ok: ({ value }) => ({ status: 'ok', value }),
        error: ({ error }) => ({ status: 'error', error }),
      }
    );

    const isEnabled = unwrapOrFail(enabledRes);
    if (maybeError(isEnabled)) {
      return { status: 'error', error: isEnabled };
    }

    if (isEnabled) {
      return { status: 'ok', value: { metaTxs: [] } };
    }

    const buildRes = await match<BuildSignSafeTx, Result<MetaTransactionData>>(
      await this.safeSuite.buildEnableModuleTx(safe, module),
      {
        ok: ({ value: { txData } }) => ({ status: 'ok', value: txData }),
        error: ({ error }) => ({ status: 'error', error }),
      }
    );

    const enableTx = unwrapOrFail(buildRes);
    if (maybeError(enableTx)) {
      return { status: 'error', error: enableTx };
    }

    return { status: 'ok', value: { metaTxs: [enableTx] } };
  }
}
