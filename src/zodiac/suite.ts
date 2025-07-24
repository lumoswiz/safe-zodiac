import { Account, Address, Hex, PublicClient, walletActions } from 'viem';
import { SafeContractSuite } from '../lib/safe';
import { ZodiacRolesSuite } from '../lib/roles';
import {
  MetaTransactionData,
  Result,
  EnsureRolesResult,
  BuildTxBucketsResult,
  ExecutionOptions,
  RolesSetupArgs,
  RoleScope,
  SetupStage,
  EnsureModuleEnabledResult,
  SafeTransactionData,
  SAFE_VERSION_FALLBACK,
  ExecutionMode,
  OperationType,
  ResolvedSafeContext,
  RolesSetupConfig,
  TxBuildOptions,
  BuildInitialSetupArgs,
  PartialRolesSetupArgs,
  ExecFullSetupTxArgs,
} from '../types';
import {
  extractOptionalMetaTx,
  makeError,
  makeOk,
  matchResult,
} from '../lib/utils';
import { generateSafeTypedData } from '../lib/safe-eip712';
import { encodeMulti } from '../lib/multisend';
import { resolveSafeContext } from './context';

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

  async execFullSetupTx({
    safe,
    account,
    maybeSaltNonce,
    config = {},
    options = {},
    executionMode = ExecutionMode.SendTransactions,
  }: ExecFullSetupTxArgs): Promise<Result<Hex[]>> {
    const contextResult = await resolveSafeContext(
      this.safeSuite,
      safe,
      account.address,
      maybeSaltNonce
    );

    return matchResult(contextResult, {
      error: ({ error }) => makeError(error),

      ok: async ({ value: context }) => {
        const txBucketsResult = await this.buildAllTx(
          context,
          account.address,
          config,
          options
        );

        return matchResult(txBucketsResult, {
          error: ({ error }) => makeError(error),

          ok: async ({ value: { setupTxs, multisendTxs } }) => {
            try {
              if (multisendTxs.length > 0) {
                const signedResult = await this.signMultisendTx(
                  context.safeAddress,
                  multisendTxs,
                  account,
                  context.deployed
                );

                const execMetaTx = await matchResult(signedResult, {
                  error: ({ error }) => Promise.reject(error),
                  ok: async ({ value: { txData, signature } }) => {
                    const execResult =
                      await this.safeSuite.buildExecTransaction(
                        context.safeAddress,
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
            } catch (error) {
              return makeError(error);
            }
          },
        });
      },
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
      return makeError(error);
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
      return makeError(error);
    }
  }

  private async buildAllTx(
    context: ResolvedSafeContext,
    owner: Address,
    config: RolesSetupConfig,
    options: TxBuildOptions
  ): Promise<BuildTxBucketsResult> {
    const { safeAddress, saltNonce, deployed } = context;
    const rolesNonce = config.rolesNonce ?? ZodiacSafeSuite.DEFAULT_ROLES_NONCE;

    if (!deployed) {
      const allBuckets = await this.buildInitialSetupTxs({
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

    const rolesRes = await this.ensureRolesModule(safeAddress, rolesNonce);
    const { rolesAddress, metaTxs: rolesTxs } = await matchResult(rolesRes, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });

    setupTxs.push(...rolesTxs);

    if (rolesTxs.length > 0) {
      const extra = await this.buildInitialSetupTxs({
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

    const enableRes = await this.ensureModuleEnabled(safeAddress, rolesAddress);
    const enableVal = await matchResult(enableRes, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });

    multisendTxs.push(...enableVal.metaTxs);

    if (enableVal.metaTxs.length > 0) {
      const extra = await this.buildInitialSetupTxs({
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
          return makeError(error);
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

  private validateSetupArgs(
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

  private async buildInitialSetupTxs(args: BuildInitialSetupArgs): Promise<{
    setupTxs: MetaTransactionData[];
    multisendTxs: MetaTransactionData[];
  }> {
    const rolesNonce =
      args.config.rolesNonce ?? ZodiacSafeSuite.DEFAULT_ROLES_NONCE;
    const rolesSetup = args.config.rolesSetup;
    this.validateSetupArgs(args.startAt, rolesSetup);
    const setupTxs: MetaTransactionData[] = [];
    const multisendTxs: MetaTransactionData[] = [];

    const addrResult = this.rolesSuite.calculateModuleProxyAddress(
      args.safeAddress,
      rolesNonce
    );

    const rolesAddress = await matchResult(addrResult, {
      ok: ({ value }) => value,
      error: ({ error }) => Promise.reject(error),
    });

    const steps: Record<SetupStage, () => Promise<void>> = {
      [SetupStage.DeploySafe]: async () => {
        setupTxs.push(await this.buildSafeDeployTx(args.owner, args.safeNonce));
      },
      [SetupStage.DeployModule]: async () => {
        const tx = await this.buildRolesDeployTx(args.safeAddress, rolesNonce);
        if (tx) setupTxs.push(tx);
      },
      [SetupStage.EnableModule]: async () => {
        multisendTxs.push(
          await this.safeSuite.buildRawEnableModuleMetaTx(
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
          await this.buildAssignRolesTx(
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
          await this.buildScopeTargetTx(
            rolesAddress,
            rolesSetup as RolesSetupArgs
          )
        );
      },
      [SetupStage.ScopeFunctions]: async () => {
        if (
          !rolesSetup?.scopes ||
          !rolesSetup?.target ||
          !rolesSetup?.roleKey
        ) {
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

    for (
      let stage = args.startAt;
      stage <= SetupStage.ScopeFunctions;
      stage++
    ) {
      await steps[stage]();
    }

    setupTxs.push(...(args.options.extraSetupTxs || []));
    multisendTxs.push(...(args.options.extraMultisendTxs || []));

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
      ok: ({ value }) => makeOk({ metaTxs: [value as MetaTransactionData] }),
      error: ({ error }) => makeError(error),
    });
  }
}
