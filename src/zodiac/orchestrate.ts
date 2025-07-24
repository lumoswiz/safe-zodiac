import { Account, Hex } from 'viem';
import { SafeSuite } from '../safe';
import {
  ExecStrategies,
  ExecutionMode,
  ResolvedSafeContext,
  Result,
  RolesSetupConfig,
  TxBuildOptions,
} from '../types';
import { matchResult, makeError, makeOk } from '../shared/utils';

import { execWithMode } from './execute';
import { RolesSuite } from '../lib/roles';
import { buildAllTx } from './build';
import { buildMultisendExecMetaTx } from './meta';

export async function orchestrateFullSetup(
  safeSuite: SafeSuite,
  rolesSuite: RolesSuite,
  context: ResolvedSafeContext,
  account: Account,
  config: RolesSetupConfig,
  options: TxBuildOptions,
  executionMode: ExecutionMode,
  strategies: ExecStrategies
): Promise<Result<Hex[]>> {
  const txBucketsResult = await buildAllTx(
    safeSuite,
    rolesSuite,
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
          const execMetaTxResult = await buildMultisendExecMetaTx(
            safeSuite,
            context.safeAddress,
            multisendTxs,
            account,
            context.deployed
          );

          const execMetaTx = await matchResult(execMetaTxResult, {
            ok: ({ value }) => value,
            error: ({ error }) => Promise.reject(error),
          });

          setupTxs.push(execMetaTx);
        }

        const execResult = await execWithMode(
          setupTxs,
          account,
          executionMode,
          strategies
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
}
