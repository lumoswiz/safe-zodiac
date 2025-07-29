import { matchResult, makeError, makeOk } from '../shared/utils';
import { execWithMode } from './execute';
import { buildAllTx } from './build';
import { buildMultisendExecMetaTx } from './meta';
export async function orchestrateFullSetup(safeSuite, rolesSuite, context, account, config, options, executionMode, strategies) {
    const txBucketsResult = await buildAllTx(safeSuite, rolesSuite, context, account.address, config, options, await safeSuite.client.getChainId());
    return matchResult(txBucketsResult, {
        error: ({ error }) => makeError(error),
        ok: async ({ value: { setupTxs, multisendTxs } }) => {
            try {
                if (multisendTxs.length > 0) {
                    const execMetaTxResult = await buildMultisendExecMetaTx(safeSuite, context.safeAddress, multisendTxs, account, context.deployed);
                    const execMetaTx = await matchResult(execMetaTxResult, {
                        ok: ({ value }) => value,
                        error: ({ error }) => Promise.reject(error),
                    });
                    setupTxs.push(execMetaTx);
                }
                const execResult = await execWithMode(setupTxs, account, executionMode, strategies);
                return matchResult(execResult, {
                    ok: ({ value }) => makeOk(value),
                    error: ({ error }) => makeError(error),
                });
            }
            catch (error) {
                return makeError(error);
            }
        },
    });
}
