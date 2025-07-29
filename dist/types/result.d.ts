import { Address, Hex } from 'viem';
import { MetaTransactionData, SafeTransactionData, SafeVersion } from './safe';
export type Result<T, E = unknown> = {
    status: 'ok';
    value: T;
} | {
    status: 'error';
    error: E;
};
export type Ok<T> = Result<T>;
export type Err<E> = Result<never, E>;
export type CalculateModuleProxyAddressResult = Result<Address>;
export type CalculateSafeAddressResult = Result<Address>;
export type GetModulesResult = Result<Address[]>;
export type GetOwnersResult = Result<Address[]>;
export type GetVersionResult = Result<SafeVersion>;
export type IsModuleDeployedResult = Result<boolean>;
export type IsModuleEnabledResult = Result<boolean>;
export type IsOwnerResult = Result<boolean>;
export type IsSafeDeployedResult = Result<boolean>;
export type IsValidSafeResult = Result<boolean>;
export type BuildMetaTxArrayResult = Result<MetaTransactionData[]>;
export type BuildMetaTxResult = Result<MetaTransactionData>;
export type BuildSignSafeTx = Result<{
    txData: SafeTransactionData;
    safeTxHash: Hex;
}>;
export type GetSafeTxHashResult = Result<Hex>;
export type IsTxReadyResult = Result<boolean>;
export type SafeTransactionDataResult = Result<SafeTransactionData>;
export type GetNonceResult = Result<bigint>;
export type GetThresholdResult = Result<bigint>;
//# sourceMappingURL=result.d.ts.map