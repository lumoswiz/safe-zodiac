import {
  Account,
  Address,
  Hex,
  isAddressEqual,
  PublicClient,
  walletActions,
} from 'viem';
import { SafeContractSuite } from './lib/safe';
import { ZodiacRolesSuite } from './lib/roles';
import {
  MetaTransactionData,
  Result,
  EnsureRolesResult,
  BuildTxBucketsResult,
  ExecutionOptions,
  RolesSetupArgs,
  RoleScope,
  SetupStage,
  PartialRolesSetupArgs,
  EnsureModuleEnabledResult,
  SafeTransactionData,
  SAFE_VERSION_FALLBACK,
  ExecutionMode,
  OperationType,
  ResolvedSafeContext,
} from './types';
import {
  extractOptionalMetaTx,
  formatError,
  makeError,
  makeOk,
  matchResult,
} from './lib/utils';
import { generateSafeTypedData } from './lib/safe-eip712';
import { encodeMulti } from './lib/multisend';

export class ZodiacSafeSuite {
  readonly safeSuite: SafeContractSuite;
  readonly rolesSuite: ZodiacRolesSuite;
  private static readonly DEFAULT_ROLES_NONCE: bigint =
    46303759331860629381431170770107494699648271559618626860680275899814502026071n;
  private readonly execStrategies: Record<
    ExecutionMode,
    (txs: MetaTransactionData[], account: Account) => Promise<Result<Hex[]>>
  > = {
    [ExecutionMode.SendCalls]: this.execWithSendCalls.bind(this),
    [ExecutionMode.SendTransactions]: this.execWithSendTransactions.bind(this),
  };

  constructor(publicClient: PublicClient) {
    this.safeSuite = new SafeContractSuite(publicClient);
    this.rolesSuite = new ZodiacRolesSuite(publicClient);
  }

  async execFullSetupTx(
    safe: Address,
    account: Account,
    maybeSaltNonce: bigint | undefined,
    rolesSetup: PartialRolesSetupArgs = {},
    rolesNonce: bigint = ZodiacSafeSuite.DEFAULT_ROLES_NONCE,
    extraSetupTxs: MetaTransactionData[] = [],
    extraMultisendTxs: MetaTransactionData[] = [],
    executionMode: ExecutionMode = ExecutionMode.SendTransactions
  ): Promise<Result<Hex[]>> {
    const contextResult = await this.resolveSafeContext(
      safe,
      account.address,
      maybeSaltNonce
    );

    return matchResult(contextResult, {
      error: ({ error }) =>
        makeError(`Failed to resolve Safe context:\n${formatError(error)}`),

      ok: async ({ value: context }) => {
        const { safeAddress, deployed } = context;

        const txBucketsResult = await this.buildAllTx(
          context,
          account.address,
          rolesSetup,
          rolesNonce,
          extraSetupTxs,
          extraMultisendTxs
        );

        return matchResult(txBucketsResult, {
          error: ({ error }) =>
            makeError(
              `Failed to build setup transactions:\n${formatError(error)}`
            ),

          ok: async ({ value: { setupTxs, multisendTxs } }) => {
            try {
              if (multisendTxs.length > 0) {
                const signedResult = await this.signMultisendTx(
                  safeAddress,
                  multisendTxs,
                  account,
                  deployed
                );

                const execMetaTx = await matchResult(signedResult, {
                  error: ({ error }) => Promise.reject(error),
                  ok: async ({ value: { txData, signature } }) => {
                    const execResult =
                      await this.safeSuite.buildExecTransaction(
                        safeAddress,
                        txData,
                        signature
                      );

                    return matchResult(execResult, {
                      ok: ({ value: { to, data, value } }) => ({
                        to,
                        data,
                        value,
                        operation: OperationType.DelegateCall,
                      }),
                      error: ({ error }) => Promise.reject(error),
                    });
                  },
                });

                setupTxs.push(execMetaTx);
              }

              const execResult = await this.execWithMode(
                setupTxs,
                account,
                executionMode
              );

              return matchResult(execResult, {
                ok: ({ value }) => makeOk(value),
                error: ({ error }) => makeError(error),
              });
            } catch (err) {
              return makeError(
                `Unexpected error during setup execution:\n${formatError(err)}`
              );
            }
          },
        });
      },
    });
  }

  private async resolveSafeContext(
    safe: Address,
    owner: Address,
    maybeSaltNonce: bigint | undefined
  ): Promise<Result<ResolvedSafeContext, string>> {
    if (maybeSaltNonce !== undefined) {
      const predictedRes = await this.safeSuite.calculateSafeAddress(
        [owner],
        maybeSaltNonce
      );
      return matchResult(predictedRes, {
        ok: ({ value: predictedAddress }) => {
          if (!isAddressEqual(predictedAddress, safe)) {
            return makeError(
              `Provided Safe address (${safe}) does not match predicted CREATE2 address (${predictedAddress})`
            );
          }
          return makeOk({
            safeAddress: predictedAddress,
            saltNonce: maybeSaltNonce,
            deployed: false,
          });
        },
        error: ({ error }) =>
          makeError(
            `Failed to calculate predicted Safe address:\n${formatError(error)}`
          ),
      });
    }

    const ownersResult = await this.safeSuite.getOwners(safe);
    return matchResult(ownersResult, {
      ok: ({ value: owners }) => {
        const [onlyOwner] = owners;
        if (
          !onlyOwner ||
          owners.length !== 1 ||
          !isAddressEqual(onlyOwner, owner)
        ) {
          return makeError('Safe is not a valid 1/1 owner configuration.');
        }

        return makeOk({
          safeAddress: safe,
          saltNonce: null,
          deployed: true,
        });
      },
      error: ({ error }) =>
        makeError(`Failed to validate Safe ownership:\n${formatError(error)}`),
    });
  }

  private async execWithMode(
    txs: MetaTransactionData[],
    account: Account,
    mode: ExecutionMode
  ): Promise<Result<Hex[]>> {
    const exec =
      this.execStrategies[mode] ??
      this.execStrategies[ExecutionMode.SendTransactions];
    return exec(txs, account);
  }

  private async execWithSendTransactions(
    txs: MetaTransactionData[],
    account: Account
  ): Promise<Result<Hex[]>> {
    const client = this.safeSuite.client.extend(walletActions);
    const txHashes: Hex[] = [];

    try {
      for (const tx of txs) {
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

      return makeOk(txHashes);
    } catch (error) {
      return makeError(`Failed to send transaction:\n${formatError(error)}`);
    }
  }

  private async execWithSendCalls(
    txs: MetaTransactionData[],
    account: Account
  ): Promise<Result<Hex[]>> {
    try {
      const client = this.safeSuite.client.extend(walletActions);

      const calls = txs.map((tx) => ({
        to: tx.to,
        data: tx.data,
        value: BigInt(tx.value),
      }));

      const { id } = await client.sendCalls({
        account,
        calls,
      });

      return makeOk([id as Hex]);
    } catch (error) {
      return makeError(`Failed to send batch calls:\n${formatError(error)}`);
    }
  }

  async buildAllTx(
    context: ResolvedSafeContext,
    owner: Address,
    rolesSetup: PartialRolesSetupArgs = {},
    rolesNonce: bigint = ZodiacSafeSuite.DEFAULT_ROLES_NONCE,
    extraSetupTxs: MetaTransactionData[] = [],
    extraMultisendTxs: MetaTransactionData[] = []
  ): Promise<BuildTxBucketsResult> {
    const { safeAddress, saltNonce, deployed } = context;

    if (!deployed) {
      if (saltNonce === null) {
        return makeError('Missing saltNonce for undeployed Safe');
      }

      const allBuckets = await this.buildInitialSetupTxs(
        safeAddress,
        owner,
        saltNonce,
        rolesNonce,
        rolesSetup,
        SetupStage.DeploySafe,
        extraSetupTxs,
        extraMultisendTxs
      );
      return makeOk(allBuckets);
    }

    const setupTxs: MetaTransactionData[] = [];
    const multisendTxs: MetaTransactionData[] = [];

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
        saltNonce ?? 0n,
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

    multisendTxs.push(...enableVal.metaTxs);

    if (enableVal.metaTxs.length > 0) {
      const extra = await this.buildInitialSetupTxs(
        safeAddress,
        owner,
        saltNonce ?? 0n,
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
    const versionResult = await this.safeSuite.getVersion(safeAddress);

    return matchResult(versionResult, {
      error: ({ error }) => makeError(error),

      ok: async ({ value: version }) => {
        try {
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
          return makeError(`Failed to sign tx:\n${formatError(error)}`);
        }
      },
    });
  }

  async signMultisendTx(
    safe: Address,
    multisendTxs: MetaTransactionData[],
    account: Account,
    IsSafeDeployed: boolean = true
  ): Promise<Result<{ txData: SafeTransactionData; signature: Hex }>> {
    const multisendTx = encodeMulti(multisendTxs);

    const signResult = await this.safeSuite.buildSignSafeTx(
      safe,
      multisendTx.to,
      multisendTx.data,
      multisendTx.operation,
      IsSafeDeployed
    );

    return matchResult(signResult, {
      error: ({ error }) => makeError(error),
      ok: async ({ value: { txData } }) => {
        try {
          const version = IsSafeDeployed
            ? await matchResult(await this.safeSuite.getVersion(safe), {
                ok: ({ value }) => value,
                error: () => SAFE_VERSION_FALLBACK,
              })
            : SAFE_VERSION_FALLBACK;
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
          return makeError(
            `Failed to sign multisend transaction:\n${formatError(error)}`
          );
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
          return makeError(
            `Failed to execute transaction:\n${formatError(error)}`
          );
        }
      },
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

    const deployResult = await extractOptionalMetaTx(
      this.rolesSuite.buildDeployModuleTx(safe, rolesNonce)
    );

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

    const addrResult = this.rolesSuite.calculateModuleProxyAddress(
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
    const txResult = await extractOptionalMetaTx(
      this.safeSuite.buildSafeDeploymentTx(owner, nonce)
    );

    return matchResult(txResult, {
      ok: ({ value }) => {
        if (!value) {
          return Promise.reject('unexpected skip');
        }
        return value;
      },
      error: ({ error }) => Promise.reject(error),
    });
  }

  private async buildRolesDeployTx(
    safeAddr: Address,
    nonce: bigint
  ): Promise<MetaTransactionData | null> {
    const txResult = await extractOptionalMetaTx(
      this.rolesSuite.buildDeployModuleTx(safeAddr, nonce)
    );

    return matchResult(txResult, {
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
    const enabledRes = await this.safeSuite.isModuleEnabled(safe, module);

    const isEnabled = await matchResult(enabledRes, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });

    if (isEnabled) {
      return makeOk({ metaTxs: [] });
    }

    const buildRes = await this.safeSuite.buildEnableModuleTx(safe, module);

    const txResult = await matchResult(buildRes, {
      ok: ({ value: { txData } }) => makeOk(txData),
      error: ({ error }) => makeError(error),
    });

    return matchResult(txResult, {
      ok: ({ value }) => makeOk({ metaTxs: [value] }),
      error: ({ error }) => makeError(error),
    });
  }
}
