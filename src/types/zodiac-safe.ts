import { Address } from 'viem';
import { PartialRolesSetupArgs } from './roles';
import { MetaTransactionData } from './safe';

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

export type ResolvedSafeContext = {
  safeAddress: Address;
  saltNonce: bigint | null;
  deployed: boolean;
};

export interface RolesSetupConfig {
  owner: Address;
  rolesSetup?: PartialRolesSetupArgs;
  rolesNonce?: bigint;
}

export interface TxBuildOptions {
  extraSetupTxs?: MetaTransactionData[];
  extraMultisendTxs?: MetaTransactionData[];
}

export interface BuildInitialSetupArgs {
  context: ResolvedSafeContext;
  config: RolesSetupConfig;
  startAt: SetupStage;
  options?: TxBuildOptions;
}
