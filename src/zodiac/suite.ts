import { Account, Address, Hex, PublicClient, walletActions } from 'viem';
import { SafeSuite } from '../lib/safe';
import { RolesSuite } from '../lib/roles';
import {
  MetaTransactionData,
  Result,
  SafeTransactionData,
  ExecutionMode,
  OperationType,
  ExecFullSetupTxArgs,
} from '../types';
import { makeError, makeOk, matchResult } from '../lib/utils';
import { resolveSafeContext } from './context';
import { buildAllTx } from './build';
import { signMultisendTx } from './signing';

export class ZodiacSuite {
  readonly safeSuite: SafeSuite;
  readonly rolesSuite: RolesSuite;
  private readonly execStrategies: Record<
    ExecutionMode,
    (txs: MetaTransactionData[], account: Account) => Promise<Result<Hex[]>>
  > = {
    [ExecutionMode.SendCalls]: this.execWithSendCalls.bind(this),
    [ExecutionMode.SendTransactions]: this.execWithSendTransactions.bind(this),
  };

  constructor(publicClient: PublicClient) {
    this.safeSuite = new SafeSuite(publicClient);
    this.rolesSuite = new RolesSuite(publicClient);
  }

  async execFullSetupTx({
    safe,
    account,
    maybeSaltNonce,
    config = {},
    options = {},
    executionMode = ExecutionMode.SendTransactions,
  }: ExecFullSetupTxArgs): Promise<Result<Hex[]>> {
    const contextResult = await resolveSafeContext(
      this.safeSuite,
      safe,
      account.address,
      maybeSaltNonce
    );

    return matchResult(contextResult, {
      error: ({ error }) => makeError(error),

      ok: async ({ value: context }) => {
        const txBucketsResult = await buildAllTx(
          this.safeSuite,
          this.rolesSuite,
          context,
          account.address,
          config,
          options
        );

        return matchResult(txBucketsResult, {
          error: ({ error }) => makeError(error),

          ok: async ({ value: { setupTxs, multisendTxs } }) => {
            try {
              if (multisendTxs.length > 0) {
                const signedResult = await signMultisendTx(
                  this.safeSuite,
                  context.safeAddress,
                  multisendTxs,
                  account,
                  context.deployed
                );

                const execMetaTx = await matchResult(signedResult, {
                  error: ({ error }) => Promise.reject(error),
                  ok: async ({ value: { txData, signature } }) => {
                    const execResult =
                      await this.safeSuite.buildExecTransaction(
                        context.safeAddress,
                        txData,
                        signature
                      );

                    return matchResult(execResult, {
                      ok: ({ value: { to, data, value } }) => ({
                        to,
                        data,
                        value,
                        operation: OperationType.DelegateCall,
                      }),
                      error: ({ error }) => Promise.reject(error),
                    });
                  },
                });

                setupTxs.push(execMetaTx);
              }

              const execResult = await this.execWithMode(
                setupTxs,
                account,
                executionMode
              );

              return matchResult(execResult, {
                ok: ({ value }) => makeOk(value),
                error: ({ error }) => makeError(error),
              });
            } catch (error) {
              return makeError(error);
            }
          },
        });
      },
    });
  }

  private async execWithMode(
    txs: MetaTransactionData[],
    account: Account,
    mode: ExecutionMode
  ): Promise<Result<Hex[]>> {
    const exec =
      this.execStrategies[mode] ??
      this.execStrategies[ExecutionMode.SendTransactions];
    return exec(txs, account);
  }

  private async execWithSendTransactions(
    txs: MetaTransactionData[],
    account: Account
  ): Promise<Result<Hex[]>> {
    const client = this.safeSuite.client.extend(walletActions);
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

  private async execWithSendCalls(
    txs: MetaTransactionData[],
    account: Account
  ): Promise<Result<Hex[]>> {
    try {
      const client = this.safeSuite.client.extend(walletActions);

      const calls = txs.map((tx) => ({
        to: tx.to,
        data: tx.data,
        value: BigInt(tx.value),
      }));

      const { id } = await client.sendCalls({
        account,
        calls,
      });

      return makeOk([id as Hex]);
    } catch (error) {
      return makeError(error);
    }
  }

  async execTx(
    safe: Address,
    txData: SafeTransactionData,
    signature: Hex,
    account: Account
  ): Promise<Result<Hex>> {
    const execResult = await this.safeSuite.buildExecTransaction(
      safe,
      txData,
      signature
    );

    return matchResult(execResult, {
      error: ({ error }) => makeError(error),

      ok: async ({ value: { to, data, value } }) => {
        try {
          const client = this.safeSuite.client.extend(walletActions);
          const hash = await client.sendTransaction({
            account,
            chain: null,
            to,
            data,
            value: BigInt(value),
          });

          await client.waitForTransactionReceipt({ hash });
          return makeOk(hash);
        } catch (error) {
          return makeError(error);
        }
      },
    });
  }
}
