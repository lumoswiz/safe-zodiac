import type { Address, Hex, TypedDataDomain, TypedDataParameter } from 'viem';
import { SafeTransactionData } from './safe';
export type TypedMessageTypes = Record<string, TypedDataParameter[]>;
export interface EIP712TypedData {
    domain: TypedDataDomain;
    types: TypedMessageTypes;
    message: Record<string, unknown>;
    primaryType: string;
}
export interface EIP712TxTypes {
    EIP712Domain: TypedDataParameter[];
    SafeTx: TypedDataParameter[];
}
export interface SafeEIP712Args {
    safeAddress: Address;
    safeVersion: string;
    chainId: number;
    data: SafeTransactionData | EIP712TypedData | Hex;
}
//# sourceMappingURL=eip712.d.ts.map