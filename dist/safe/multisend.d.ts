/**
 * @file multisend.ts
 *
 * @acknowledgement
 *   Adapted from the “multisend.ts” implementation in the
 *   BitteProtocol near-safe repo:
 *   https://github.com/BitteProtocol/near-safe/blob/main/src/lib/multisend.ts
 */
import { type Address, type Hex } from 'viem';
import { type MetaTransactionData } from '@sdk/types';
export declare const MULTI_SEND_ABI: readonly [{
    readonly name: "multiSend";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "bytes";
        readonly name: "transactions";
    }];
    readonly outputs: readonly [];
}];
export declare function encodeMulti(transactions: readonly MetaTransactionData[], multiSendContractAddress?: Address): MetaTransactionData;
export declare function decodeMulti(data: Hex): MetaTransactionData[];
//# sourceMappingURL=multisend.d.ts.map