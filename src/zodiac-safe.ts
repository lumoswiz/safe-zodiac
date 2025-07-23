import {
  Account,
  Address,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  Hex,
  isAddressEqual,
  PublicClient,
  walletActions,
} from 'viem';
import { SafeContractSuite } from './lib/safe';
import { ZodiacRolesSuite } from './lib/roles';
import {
  IsValidSafeResult,
  MetaTransactionData,
  Result,
  EnsureSafeResult,
  BuildTxResult,
  EnsureRolesResult,
  BuildTxBucketsResult,
  ExecutionOptions,
  RolesSetupArgs,
  BuildSignSafeTx,
  RoleScope,
  SetupStage,
  PartialRolesSetupArgs,
  EnsureModuleEnabledResult,
  IsModuleEnabledResult,
  SafeTransactionData,
} from './types';
import {
  expectValue,
  isContractDeployed,
  makeError,
  makeOk,
  match,
  matchResult,
  maybeError,
  unwrapOrFail,
} from './lib/utils';
import { generateSafeTypedData } from './lib/safe-eip712';
import { encodeMulti } from './lib/multisend';

export class ZodiacSafeSuite {
  readonly safeSuite: SafeContractSuite;
  readonly rolesSuite: ZodiacRolesSuite;
  private static readonly DEFAULT_ROLES_NONCE: bigint =
    46303759331860629381431170770107494699648271559618626860680275899814502026071n;

  constructor(publicClient: PublicClient) {
    this.safeSuite = new SafeContractSuite(publicClient);
    this.rolesSuite = new ZodiacRolesSuite(publicClient);
  }

  async execFullSetupTx(
    safe: Address,
    owner: Address,
    safeNonce: bigint,
    account: Account,
    rolesSetup: PartialRolesSetupArgs = {},
    rolesNonce: bigint = ZodiacSafeSuite.DEFAULT_ROLES_NONCE,
    extraSetupTxs: MetaTransactionData[] = [],
    extraMultisendTxs: MetaTransactionData[] = []
  ): Promise<Result<Hex[]>> {
    const client = this.safeSuite.client.extend(walletActions);

    return matchResult(
      await this.buildAllTx(
        safe,
        owner,
        safeNonce,
        rolesSetup,
        rolesNonce,
        extraSetupTxs,
        extraMultisendTxs
      ),
      {
        error: (err) => makeError(err.error),

        ok: async ({ value: { setupTxs, multisendTxs } }) => {
          const txHashes: Hex[] = [];

          try {
            for (const tx of setupTxs) {
              const hash = await client.sendTransaction({
                account,
                chain: null,
                to: tx.to,
                data: tx.data,
                value: BigInt(tx.value),
              });
              await client.waitForTransactionReceipt({ hash });
              txHashes.push(hash);
            }

            if (multisendTxs.length > 0) {
              const signedResult = await this.signMultisendTx(
                safe,
                multisendTxs,
                account
              );

              return matchResult(signedResult, {
                error: (err) => makeError(err.error),

                ok: async ({ value: { txData, signature } }) => {
                  const execResult = await this.execTx(
                    safe,
                    txData,
                    signature,
                    account
                  );

                  return matchResult(execResult, {
                    error: (err) => makeError(err.error),
                    ok: ({ value: hash }) => {
                      txHashes.push(hash);
                      return makeOk(txHashes);
                    },
                  });
                },
              });
            }

            return makeOk(txHashes);
          } catch (err) {
            return makeError(err);
          }
        },
      }
    );
  }

  async buildAllTx(
    safe: Address,
    owner: Address,
    safeNonce: bigint,
    rolesSetup: PartialRolesSetupArgs = {},
    rolesNonce: bigint = ZodiacSafeSuite.DEFAULT_ROLES_NONCE,
    extraSetupTxs: MetaTransactionData[] = [],
    extraMultisendTxs: MetaTransactionData[] = []
  ): Promise<BuildTxBucketsResult> {
    const isDeployed = await isContractDeployed(this.safeSuite.client, safe);

    if (!isDeployed) {
      const allBuckets = await this.buildInitialSetupTxs(
        safe,
        owner,
        safeNonce,
        rolesNonce,
        rolesSetup,
        SetupStage.DeploySafe,
        extraSetupTxs,
        extraMultisendTxs
      );
      return makeOk(allBuckets);
    }

    const safeRes = await this.ensureSingleOwnerSafe(safe, owner, safeNonce);
    const { safeAddress, metaTxs: safeTxs } = await matchResult(safeRes, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });

    const setupTxs: MetaTransactionData[] = [...safeTxs];
    const multisendTxs: MetaTransactionData[] = [];

    const startStage =
      safeTxs.length > 0 ? SetupStage.DeploySafe : SetupStage.DeployModule;

    const extra = await this.buildInitialSetupTxs(
      safeAddress,
      owner,
      safeNonce,
      rolesNonce,
      rolesSetup,
      startStage,
      extraSetupTxs,
      extraMultisendTxs
    );

    setupTxs.push(...extra.setupTxs);
    multisendTxs.push(...extra.multisendTxs);

    if (startStage === SetupStage.DeploySafe) {
      return makeOk({ setupTxs, multisendTxs });
    }

    const rolesRes = await this.ensureRolesModule(safeAddress, rolesNonce);
    const { rolesAddress, metaTxs: rolesTxs } = await matchResult(rolesRes, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });

    setupTxs.push(...rolesTxs);

    if (rolesTxs.length > 0) {
      const extra = await this.buildInitialSetupTxs(
        safeAddress,
        owner,
        safeNonce,
        rolesNonce,
        rolesSetup,
        SetupStage.EnableModule,
        extraSetupTxs,
        extraMultisendTxs
      );
      setupTxs.push(...extra.setupTxs);
      multisendTxs.push(...extra.multisendTxs);
      return makeOk({ setupTxs, multisendTxs });
    }

    const enableRes = await this.ensureModuleEnabled(safeAddress, rolesAddress);
    const enableVal = await matchResult(enableRes, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });

    const enableTxs = enableVal.metaTxs;
    multisendTxs.push(...enableTxs);

    if (enableTxs.length > 0) {
      const extra = await this.buildInitialSetupTxs(
        safeAddress,
        owner,
        safeNonce,
        rolesNonce,
        rolesSetup,
        SetupStage.AssignRoles,
        extraSetupTxs,
        extraMultisendTxs
      );
      multisendTxs.push(...extra.multisendTxs);
      return makeOk({ setupTxs, multisendTxs });
    }

    return makeOk({ setupTxs, multisendTxs });
  }

  async signTx(
    safeAddress: Address,
    txData: SafeTransactionData,
    account: Account
  ): Promise<Result<Hex>> {
    try {
      const version = await expectValue(this.safeSuite.getVersion(safeAddress));
      const chainId = await this.safeSuite.client.getChainId();

      const typedData = generateSafeTypedData({
        safeAddress,
        safeVersion: version,
        chainId,
        data: txData,
      });

      const signature = await this.safeSuite.client
        .extend(walletActions)
        .signTypedData({
          account,
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        });

      return makeOk(signature);
    } catch (error) {
      return makeError(error);
    }
  }
  async signMultisendTx(
    safe: Address,
    multisendTxs: MetaTransactionData[],
    account: Account
  ): Promise<Result<{ txData: SafeTransactionData; signature: Hex }>> {
    const multisendTx = encodeMulti(multisendTxs);

    const signResult = await this.safeSuite.buildSignSafeTx(
      safe,
      multisendTx.to,
      multisendTx.data,
      multisendTx.operation
    );

    return matchResult(signResult, {
      error: ({ error }) => makeError(error),

      ok: async ({ value: { txData } }) => {
        try {
          const version = await expectValue(this.safeSuite.getVersion(safe));
          const chainId = await this.safeSuite.client.getChainId();

          const typedData = generateSafeTypedData({
            safeAddress: safe,
            safeVersion: version,
            chainId,
            data: txData,
          });

          const signature = await this.safeSuite.client
            .extend(walletActions)
            .signTypedData({
              account,
              domain: typedData.domain,
              types: typedData.types,
              primaryType: typedData.primaryType,
              message: typedData.message,
            });

          return makeOk({ txData, signature });
        } catch (error) {
          return makeError(error);
        }
      },
    });
  }

  async execTx(
    safe: Address,
    txData: SafeTransactionData,
    signature: Hex,
    account: Account
  ): Promise<Result<Hex>> {
    const execResult = await this.safeSuite.buildExecTransaction(
      safe,
      txData,
      signature
    );

    return matchResult(execResult, {
      error: ({ error }) => makeError(error),

      ok: async ({ value: { to, data, value } }) => {
        try {
          const client = this.safeSuite.client.extend(walletActions);
          const hash = await client.sendTransaction({
            account,
            chain: null,
            to,
            data,
            value: BigInt(value),
          });

          await client.waitForTransactionReceipt({ hash });
          return makeOk(hash);
        } catch (error) {
          return makeError(error);
        }
      },
    });
  }

  private async ensureSingleOwnerSafe(
    safe: Address,
    owner: Address,
    safeNonce: bigint
  ): Promise<EnsureSafeResult> {
    const isValidResult = await this.isValidSafe(safe, owner);

    const isValid = await matchResult(isValidResult, {
      ok: ({ value }) => value,
      error: ({ error }) => {
        if (
          error instanceof ContractFunctionRevertedError ||
          error instanceof ContractFunctionExecutionError
        ) {
          return false;
        }
        return Promise.reject(error);
      },
    });

    if (!isValid) {
      const deployRes = await this.safeSuite.buildSafeDeploymentTx(
        owner,
        safeNonce
      );

      const buildRes = await match<
        BuildTxResult,
        Result<MetaTransactionData | null>
      >(deployRes, {
        built: ({ tx }) => makeOk(tx),
        skipped: () => makeOk(null),
        error: ({ error }) => makeError(error),
      });

      return matchResult(buildRes, {
        ok: ({ value }) =>
          makeOk({
            safeAddress: safe,
            metaTxs: value ? [value] : [],
          }),
        error: ({ error }) => makeError(error),
      });
    }

    return makeOk({ safeAddress: safe, metaTxs: [] });
  }

  private async isValidSafe(
    safe: Address,
    owner: Address
  ): Promise<IsValidSafeResult> {
    const ownersResult = await this.safeSuite.getOwners(safe);

    return matchResult(ownersResult, {
      ok: ({ value: owners }) => {
        const [onlyOwner] = owners;
        if (!onlyOwner || owners.length !== 1) {
          return makeOk(false);
        }
        return makeOk(isAddressEqual(owner, onlyOwner));
      },
      error: ({ error }) => makeError(error),
    });
  }

  private async ensureRolesModule(
    safe: Address,
    rolesNonce: bigint = ZodiacSafeSuite.DEFAULT_ROLES_NONCE
  ): Promise<EnsureRolesResult> {
    const addrResult = this.rolesSuite.calculateModuleProxyAddress(
      safe,
      rolesNonce
    );

    const rolesAddress = await matchResult(addrResult, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });

    const deployedResult = await this.rolesSuite.isModuleDeployed(
      safe,
      rolesNonce
    );

    const isDeployed = await matchResult(deployedResult, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });

    if (isDeployed) {
      return makeOk({ rolesAddress, metaTxs: [] });
    }

    const buildRes = await this.rolesSuite.buildDeployModuleTx(
      safe,
      rolesNonce
    );

    const deployResult = await match<
      BuildTxResult,
      Result<MetaTransactionData | null>
    >(buildRes, {
      built: ({ tx }) => makeOk(tx),
      skipped: () => makeOk(null),
      error: ({ error }) => makeError(error),
    });

    return matchResult(deployResult, {
      ok: ({ value }) =>
        makeOk({ rolesAddress, metaTxs: value ? [value] : [] }),
      error: ({ error }) => makeError(error),
    });
  }

  private async buildInitialSetupTxs(
    safeAddress: Address,
    owner: Address,
    safeNonce: bigint,
    rolesNonce: bigint,
    rolesSetup: PartialRolesSetupArgs = {},
    startAt: SetupStage,
    extraSetupTxs: MetaTransactionData[] = [],
    extraMultisendTxs: MetaTransactionData[] = []
  ): Promise<{
    setupTxs: MetaTransactionData[];
    multisendTxs: MetaTransactionData[];
  }> {
    const setupTxs: MetaTransactionData[] = [];
    const multisendTxs: MetaTransactionData[] = [];

    const addrResult = await this.rolesSuite.calculateModuleProxyAddress(
      safeAddress,
      rolesNonce
    );

    const rolesAddress = await matchResult(addrResult, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });

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
          await this.safeSuite.buildRawEnableModuleMetaTx(
            safeAddress,
            rolesAddress
          )
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

    setupTxs.push(...extraSetupTxs);
    multisendTxs.push(...extraMultisendTxs);

    return { setupTxs, multisendTxs };
  }

  private async buildSafeDeployTx(
    owner: Address,
    nonce: bigint
  ): Promise<MetaTransactionData> {
    const result = await this.safeSuite.buildSafeDeploymentTx(owner, nonce);

    const tx = await match(result, {
      built: ({ tx }) => makeOk(tx),
      skipped: () => makeError('unexpected skip'),
      error: ({ error }) => makeError(error),
    });

    return matchResult(tx, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });
  }

  private async buildRolesDeployTx(
    safeAddr: Address,
    nonce: bigint
  ): Promise<MetaTransactionData | null> {
    const result = await this.rolesSuite.buildDeployModuleTx(safeAddr, nonce);

    const tx: Result<MetaTransactionData | null> = await match<
      BuildTxResult,
      Result<MetaTransactionData | null>
    >(result, {
      built: ({ tx }) => makeOk(tx),
      skipped: () => makeOk(null),
      error: ({ error }) => makeError(error),
    });

    return matchResult(tx, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });
  }

  private async buildAssignRolesTx(
    moduleAddr: Address,
    setup: RolesSetupArgs
  ): Promise<MetaTransactionData> {
    const result = await this.rolesSuite.buildAssignRolesTx(
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

  private async buildScopeTargetTx(
    moduleAddr: Address,
    setup: RolesSetupArgs
  ): Promise<MetaTransactionData> {
    const result = await this.rolesSuite.buildScopeTargetTx(
      moduleAddr,
      setup.roleKey,
      setup.target
    );

    return matchResult(result, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });
  }

  private async buildScopeFunctionTx(
    moduleAddr: Address,
    setup: RolesSetupArgs,
    scope: RoleScope
  ): Promise<MetaTransactionData> {
    const result = await this.rolesSuite.buildScopeFunctionTx(
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
