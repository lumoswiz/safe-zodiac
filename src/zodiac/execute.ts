import { Account, Hex, walletActions } from 'viem';
import {
  ExecStrategies,
  ExecutionMode,
  MetaTransactionData,
  Result,
} from '@sdk/types';
import { SafeSuite } from '../safe';
import { makeError, makeOk } from '../shared/utils';

export async function execWithMode(
  txs: MetaTransactionData[],
  account: Account,
  mode: ExecutionMode,
  strategies: ExecStrategies
): Promise<Result<Hex[]>> {
  const exec = strategies[mode] ?? strategies[ExecutionMode.SendTransactions];
  return exec(txs, account);
}

export async function execWithSendTransactions(
  safeSuite: SafeSuite,
  txs: MetaTransactionData[],
  account: Account
): Promise<Result<Hex[]>> {
  const client = safeSuite.client.extend(walletActions);
  const txHashes: Hex[] = [];

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
  } catch (error) {
    return makeError(error);
  }
}

export async function execWithSendCalls(
  safeSuite: SafeSuite,
  txs: MetaTransactionData[],
  account: Account
): Promise<Result<Hex[]>> {
  try {
    const { id } = await safeSuite.client.extend(walletActions).sendCalls({
      account,
      calls: txs.map((tx) => ({
        to: tx.to,
        data: tx.data,
        value: BigInt(tx.value),
      })),
    });

    return makeOk([id as Hex]);
  } catch (error) {
    return makeError(error);
  }
}
