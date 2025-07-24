import { Account, Address, Hex } from 'viem';
import { PartialRolesSetupArgs } from './roles';
import { MetaTransactionData } from './safe';
import { SafeSuite } from '../safe/suite';
import { RolesSuite } from '../roles/suite';
import { Result } from './result';

export enum SetupStage {
  DeploySafe,
  DeployModule,
  EnableModule,
  AssignRoles,
  ScopeTarget,
  ScopeFunctions,
}

export enum ExecutionMode {
  SendTransactions = 'legacy',
  SendCalls = 'eip5792',
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

export type ExecFullSetupTxArgs = {
  safe: Address;
  account: Account;
  maybeSaltNonce?: bigint;
  config?: RolesSetupConfig;
  options?: TxBuildOptions;
  executionMode?: ExecutionMode;
};
