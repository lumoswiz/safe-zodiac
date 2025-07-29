import { Account, Hex } from 'viem';
import { SafeSuite } from '../safe';
import { MetaTransactionData, Result } from '@sdk/types';
export declare function buildMultisendExecMetaTx(safeSuite: SafeSuite, safeAddress: Hex, multisendTxs: MetaTransactionData[], account: Account, isDeployed: boolean): Promise<Result<MetaTransactionData>>;
//# sourceMappingURL=meta.d.ts.map