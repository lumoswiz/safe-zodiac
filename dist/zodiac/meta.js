import { OperationType } from '@sdk/types';
import { matchResult, makeError, makeOk } from '../shared/utils';
import { signMultisendTx } from './signing';
export async function buildMultisendExecMetaTx(safeSuite, safeAddress, multisendTxs, account, isDeployed) {
    const signedResult = await signMultisendTx(safeSuite, safeAddress, multisendTxs, account, isDeployed);
    return matchResult(signedResult, {
        error: ({ error }) => makeError(error),
        ok: async ({ value: { txData, signature } }) => {
            const execResult = await safeSuite.buildExecTransaction(safeAddress, txData, signature);
            return matchResult(execResult, {
                ok: ({ value: { to, data, value } }) => makeOk({
                    to,
                    data,
                    value,
                    operation: OperationType.DelegateCall,
                }),
                error: ({ error }) => makeError(error),
            });
        },
    });
}
