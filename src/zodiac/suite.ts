import { Hex, PublicClient } from 'viem';
import { SafeSuite } from '../lib/safe';
import { RolesSuite } from '../lib/roles';
import {
  Result,
  ExecutionMode,
  ExecFullSetupTxArgs,
  ExecStrategies,
} from '../types';
import { makeError, matchResult } from '../lib/utils';
import { resolveSafeContext } from './context';
import { orchestrateFullSetup } from './orchestrate';
import { execWithSendCalls, execWithSendTransactions } from './execute';

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

      ok: ({ value: context }) =>
        orchestrateFullSetup(
          this.safeSuite,
          this.rolesSuite,
          context,
          account,
          config,
          options,
          executionMode,
          this.execStrategies
        ),
    });
  }
}
