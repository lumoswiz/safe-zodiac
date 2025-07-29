import type { Address, Hex } from 'viem';
export declare enum OperationType {
    Call = 0,
    DelegateCall = 1
}
export type SafeVersion = '1.4.1' | '1.3.0' | '1.2.0' | '1.1.1' | '1.0.0';
export declare const SAFE_VERSION_FALLBACK: SafeVersion;
export type MinimalSafeInfo = {
    address: Address;
    chainId: number;
    version: SafeVersion;
};
export interface MetaTransactionData {
    readonly to: Address;
    readonly value: Hex;
    readonly data: Hex;
    readonly operation?: OperationType;
}
export interface SafeTransactionData extends MetaTransactionData {
    operation: OperationType;
    safeTxGas: bigint;
    baseGas: bigint;
    gasPrice: bigint;
    gasToken: Address;
    refundReceiver: Address;
    nonce: bigint;
}
//# sourceMappingURL=safe.d.ts.map