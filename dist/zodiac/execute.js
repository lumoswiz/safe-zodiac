import { walletActions } from 'viem';
import { ExecutionMode, } from '@sdk/types';
import { makeError, makeOk } from '../shared/utils';
export async function execWithMode(txs, account, mode, strategies) {
    const exec = strategies[mode] ?? strategies[ExecutionMode.SendTransactions];
    return exec(txs, account);
}
export async function execWithSendTransactions(safeSuite, txs, account) {
    const client = safeSuite.client.extend(walletActions);
    const txHashes = [];
    try {
        for (const tx of txs) {
            const hash = await client.sendTransaction({
                account,
                chain: null,
                to: tx.to,
                data: tx.data,
                value: BigInt(tx.value),
            });
            await client.waitForTransactionReceipt({ hash });
            txHashes.push(hash);
        }
        return makeOk(txHashes);
    }
    catch (error) {
        return makeError(error);
    }
}
export async function execWithSendCalls(safeSuite, txs, account) {
    try {
        const { id } = await safeSuite.client.extend(walletActions).sendCalls({
            account,
            calls: txs.map((tx) => ({
                to: tx.to,
                data: tx.data,
                value: BigInt(tx.value),
            })),
        });
        return makeOk([id]);
    }
    catch (error) {
        return makeError(error);
    }
}
