import { RolesSuite } from '../roles/suite';
import { ExecutionMode, } from '@sdk/types';
import { makeError, matchResult } from '../shared/utils';
import { resolveSafeContext } from './context';
import { orchestrateFullSetup } from './orchestrate';
import { execWithSendCalls, execWithSendTransactions } from './execute';
import { SafeSuite } from '../safe';
export class ZodiacSuite {
    constructor(publicClient) {
        this.safeSuite = new SafeSuite(publicClient);
        this.rolesSuite = new RolesSuite(publicClient);
        this.execStrategies = {
            [ExecutionMode.SendCalls]: (txs, account) => execWithSendCalls(this.safeSuite, txs, account),
            [ExecutionMode.SendTransactions]: (txs, account) => execWithSendTransactions(this.safeSuite, txs, account),
        };
    }
    async getPredictedSafeAddress(owner, saltNonce) {
        const result = await this.safeSuite.calculateSafeAddress([owner], saltNonce);
        return matchResult(result, {
            ok: ({ value }) => value,
            error: ({ error }) => {
                throw new Error(`Failed to calculate predicted Safe address: ${typeof error === 'string' ? error : String(error)}`);
            },
        });
    }
    async getPredictedRolesAddress(safe, saltNonce) {
        const result = this.rolesSuite.calculateModuleProxyAddress(safe, saltNonce);
        return matchResult(result, {
            ok: ({ value }) => value,
            error: ({ error }) => {
                throw new Error(`Failed to calculate predicted Safe address: ${typeof error === 'string' ? error : String(error)}`);
            },
        });
    }
    async execFullSetupTx({ safe, account, maybeSaltNonce, config = {}, options = {}, executionMode = ExecutionMode.SendTransactions, }) {
        const contextResult = await resolveSafeContext(this.safeSuite, safe, account.address, maybeSaltNonce);
        return matchResult(contextResult, {
            error: ({ error }) => makeError(error),
            ok: ({ value: context }) => orchestrateFullSetup(this.safeSuite, this.rolesSuite, context, account, config, options, executionMode, this.execStrategies),
        });
    }
}
