import { Address, ParseAbi } from 'viem';

export interface Deployment {
  abi: unknown[] | ParseAbi<readonly string[]>;
  address: Address;
}

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

export * from './result';
export * from './safe';
export * from './roles';
export * from './subgraph';
