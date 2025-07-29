/**
 * @file multisend.ts
 *
 * @acknowledgement
 *   Adapted from the “multisend.ts” implementation in the
 *   BitteProtocol near-safe repo:
 *   https://github.com/BitteProtocol/near-safe/blob/main/src/lib/multisend.ts
 */
import { decodeFunctionData, encodeFunctionData, encodePacked, getAddress, parseAbi, size, toHex, } from 'viem';
import { OperationType } from '@sdk/types';
export const MULTI_SEND_ABI = parseAbi([
    'function multiSend(bytes memory transactions)',
]);
const MULTISEND_141 = '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526';
const MULTISEND_CALLONLY_141 = '0x9641d764fc13c8B624c04430C7356C1C7C8102e2';
const encodeMetaTx = (tx) => encodePacked(['uint8', 'address', 'uint256', 'uint256', 'bytes'], [
    tx.operation || OperationType.Call,
    tx.to,
    BigInt(tx.value),
    BigInt(size(tx.data)),
    tx.data,
]);
const remove0x = (hexString) => hexString.slice(2);
export function encodeMulti(transactions, multiSendContractAddress = transactions.some((t) => t.operation === OperationType.DelegateCall)
    ? MULTISEND_141
    : MULTISEND_CALLONLY_141) {
    const encodedTransactions = '0x' + transactions.map(encodeMetaTx).map(remove0x).join('');
    return {
        operation: OperationType.DelegateCall,
        to: multiSendContractAddress,
        value: '0x00',
        data: encodeFunctionData({
            abi: MULTI_SEND_ABI,
            functionName: 'multiSend',
            args: [encodedTransactions],
        }),
    };
}
function unpack(packed, startIndex) {
    const operation = parseInt(packed.substring(startIndex, startIndex + 2), 16);
    const to = getAddress('0x' + packed.substring(startIndex + 2, startIndex + 42));
    const value = toHex(BigInt('0x' + packed.substring(startIndex + 42, startIndex + 106)));
    const hexDataLength = parseInt(packed.substring(startIndex + 106, startIndex + 170), 16);
    const endIndex = startIndex + 170 + hexDataLength * 2;
    const data = ('0x' + packed.substring(startIndex + 170, endIndex));
    return { operation, to, value, data, endIndex };
}
export function decodeMulti(data) {
    const { args } = decodeFunctionData({
        abi: MULTI_SEND_ABI,
        data,
    });
    const [transactionsEncoded] = args;
    const result = [];
    let cursor = 2;
    while (cursor < transactionsEncoded.length) {
        const { endIndex, ...tx } = unpack(transactionsEncoded, cursor);
        result.push(tx);
        cursor = endIndex;
    }
    return result;
}
