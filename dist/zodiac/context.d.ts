import { Address } from 'viem';
import { ResolvedSafeContext, Result } from '@sdk/types';
import { SafeSuite } from '../safe';
export declare function resolveSafeContext(safeSuite: SafeSuite, safe: Address, owner: Address, maybeSaltNonce: bigint | undefined): Promise<Result<ResolvedSafeContext>>;
//# sourceMappingURL=context.d.ts.map