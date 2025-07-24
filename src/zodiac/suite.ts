import { Address, Hex, PublicClient } from 'viem';
import { RolesSuite } from '../roles/suite';
import {
  Result,
  ExecutionMode,
  ExecFullSetupTxArgs,
  ExecStrategies,
} from '../types';
import { makeError, matchResult } from '../shared/utils';
import { resolveSafeContext } from './context';
import { orchestrateFullSetup } from './orchestrate';
import { execWithSendCalls, execWithSendTransactions } from './execute';
import { SafeSuite } from '../safe';

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

  async getPredictedSafeAddress(
    owner: Address,
    saltNonce: bigint
  ): Promise<Address> {
    const result = await this.safeSuite.calculateSafeAddress(
      [owner],
      saltNonce
    );
    return matchResult(result, {
      ok: ({ value }) => value,
      error: ({ error }) => {
        throw new Error(
          `Failed to calculate predicted Safe address: ${
            typeof error === 'string' ? error : String(error)
          }`
        );
      },
    });
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
