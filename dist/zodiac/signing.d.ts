import { Account, Address, Hex } from 'viem';
import { MetaTransactionData, Result, SafeTransactionData } from '@sdk/types';
import { SafeSuite } from '../safe';
export declare function signTx(safeSuite: SafeSuite, safeAddress: Address, txData: SafeTransactionData, account: Account): Promise<Result<Hex>>;
export declare function signMultisendTx(safeSuite: SafeSuite, safe: Address, multisendTxs: MetaTransactionData[], account: Account, IsSafeDeployed?: boolean): Promise<Result<{
    txData: SafeTransactionData;
    signature: Hex;
}>>;
//# sourceMappingURL=signing.d.ts.map