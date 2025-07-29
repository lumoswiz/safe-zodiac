import { type Hash } from 'viem';
import { EIP712TypedData, MinimalSafeInfo, Result } from '@sdk/types';
export type DecodedSafeMessage = {
    decodedMessage: string | EIP712TypedData;
    safeMessageMessage: string;
    safeMessageHash: Hash;
};
export declare function decodeSafeMessage(message: string | EIP712TypedData, safe: MinimalSafeInfo): Result<DecodedSafeMessage>;
//# sourceMappingURL=message.d.ts.map