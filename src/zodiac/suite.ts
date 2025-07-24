import { Hex, PublicClient } from 'viem';
import { SafeSuite } from '../lib/safe';
import { RolesSuite } from '../lib/roles';
import {
  Result,
  ExecutionMode,
  OperationType,
  ExecFullSetupTxArgs,
  ExecStrategies,
} from '../types';
import { makeError, makeOk, matchResult } from '../lib/utils';
import { resolveSafeContext } from './context';
import { buildAllTx } from './build';
import { signMultisendTx } from './signing';
import {
  execWithMode,
  execWithSendCalls,
  execWithSendTransactions,
} from './execute';

export class ZodiacSuite {
  readonly safeSuite: SafeSuite;
  readonly rolesSuite: RolesSuite;
  private readonly execStrategies: ExecStrategies;

  constructor(publicClient: PublicClient) {
    this.safeSuite = new SafeSuite(publicClient);
    this.rolesSuite = new RolesSuite(publicClient);

    this.execStrategies = {
      [ExecutionMode.SendCalls]: (txs, account) =>
        execWithSendCalls(this.safeSuite, txs, account),
      [ExecutionMode.SendTransactions]: (txs, account) =>
        execWithSendTransactions(this.safeSuite, txs, account),
    };
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

              const execResult = await execWithMode(
                setupTxs,
                account,
                executionMode,
                this.execStrategies
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
}
