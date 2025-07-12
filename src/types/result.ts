import type { Address } from 'viem';
import type { MetaTransactionData, SafeVersion } from './safe';

export type Ok<T> = { status: 'ok'; value: T };
export type Err<E> = { status: 'error'; error: E };
export type Result<T, E = unknown> =
  | { status: 'ok'; value: T }
  | { status: 'error'; error: E };

export type GetNonceResult = Result<bigint>;
export type GetThresholdResult = Result<bigint>;
export type GetModulesResult = Result<Address[]>;
export type IsModuleEnabledResult = Result<boolean>;
export type CalculateSafeAddressResult = Result<Address>;
export type GetVersionResult = Result<SafeVersion, string>;
export type IsSafeDeployedResult = Result<boolean>;
export type CalculateModuleProxyAddressResult = Result<Address>;
export type IsModuleDeployedResult = Result<boolean>;
export type GetOwnersResult = Result<Address[]>;
export type IsOwnerResult = Result<boolean>;
export type BuildModuleTxResult = Result<MetaTransactionData>;

export type BuildTxResult =
  | { status: 'skipped' }
  | { status: 'built'; tx: MetaTransactionData }
  | Err<unknown>;
