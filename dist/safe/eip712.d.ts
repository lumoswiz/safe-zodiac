import { Hex } from 'viem';
import { EIP712TxTypes, EIP712TypedData, SafeEIP712Args } from '@sdk/types';
export declare function getEip712TxTypes(safeVersion: string): EIP712TxTypes;
export declare function generateSafeTypedData(args: SafeEIP712Args): EIP712TypedData;
export declare function calculateSafeEIP712Hash(args: SafeEIP712Args): Hex;
//# sourceMappingURL=eip712.d.ts.map