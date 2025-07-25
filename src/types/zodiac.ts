import { Account, Address, Hex } from 'viem';
import { MetaTransactionData } from './safe';
import { Result } from './result';
import { PartialRolesSetupArgs } from './roles';
import { SafeSuite } from 'safe';
import { RolesSuite } from 'roles/suite';

export enum ExecutionMode {
  SendTransactions = 'legacy',
  SendCalls = 'eip5792',
}

export enum SetupStage {
  DeploySafe,
  DeployModule,
  EnableModule,
  AssignRoles,
  ScopeTarget,
  ScopeFunctions,
  NothingToDo,
}

export type ExecStrategy = (
  txs: MetaTransactionData[],
  account: Account
) => Promise<Result<Hex[]>>;

export type ExecStrategies = Record<ExecutionMode, ExecStrategy>;

export type ResolvedSafeContext =
  | { safeAddress: Address; saltNonce: bigint; deployed: false }
  | { safeAddress: Address; saltNonce: null; deployed: true };

export interface RolesSetupConfig {
  rolesSetup?: PartialRolesSetupArgs;
  rolesNonce?: bigint;
}

export interface TxBuildOptions {
  extraSetupTxs?: MetaTransactionData[];
  extraMultisendTxs?: MetaTransactionData[];
}

export interface BuildInitialSetupArgs {
  safeSuite: SafeSuite;
  rolesSuite: RolesSuite;
  safeAddress: Address;
  safeNonce: bigint;
  owner: Address;
  config: RolesSetupConfig;
  startAt: SetupStage;
  options: TxBuildOptions;
}

export interface DetermineStartStageArgs {
  safeSuite: SafeSuite;
  rolesSuite: RolesSuite;
  context: ResolvedSafeContext;
  config: RolesSetupConfig;
  chainId: number;
}

export interface ExecFullSetupTxArgs {
  safe: Address;
  account: Account;
  maybeSaltNonce?: bigint;
  config?: RolesSetupConfig;
  options?: TxBuildOptions;
  executionMode?: ExecutionMode;
}

export interface RoleSubgraphStatus {
  assigned: boolean;
  assignedToMember: boolean;
  targetScoped: boolean;
  selectorsScoped: boolean;
  missingSelectors?: Hex[] | undefined;
}

export type BuildTxValue =
  | { kind: 'built'; tx: MetaTransactionData }
  | { kind: 'skipped' };

export type BuildTxResult = Result<BuildTxValue>;

export type BuildTxBucketsResult = Result<{
  setupTxs: MetaTransactionData[];
  multisendTxs: MetaTransactionData[];
}>;

export type EnsureModuleEnabledResult = Result<{
  metaTxs: MetaTransactionData[];
}>;

export type EnsureRolesResult = Result<{
  rolesAddress: Address;
  metaTxs: MetaTransactionData[];
}>;

export type EnsureSafeResult = Result<{
  safeAddress: Address;
  metaTxs: MetaTransactionData[];
}>;
