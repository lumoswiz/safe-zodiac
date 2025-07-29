import { Account, Hex } from 'viem';
import { ExecStrategies, ExecutionMode, MetaTransactionData, Result } from '@sdk/types';
import { SafeSuite } from '../safe';
export declare function execWithMode(txs: MetaTransactionData[], account: Account, mode: ExecutionMode, strategies: ExecStrategies): Promise<Result<Hex[]>>;
export declare function execWithSendTransactions(safeSuite: SafeSuite, txs: MetaTransactionData[], account: Account): Promise<Result<Hex[]>>;
export declare function execWithSendCalls(safeSuite: SafeSuite, txs: MetaTransactionData[], account: Account): Promise<Result<Hex[]>>;
//# sourceMappingURL=execute.d.ts.map