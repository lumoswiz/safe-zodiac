import { Address } from 'viem';
import { BuildTxBucketsResult, ResolvedSafeContext, RolesSetupConfig, TxBuildOptions } from '@sdk/types';
import { SafeSuite } from '../safe';
import { RolesSuite } from '../roles/suite';
export declare function buildAllTx(safeSuite: SafeSuite, rolesSuite: RolesSuite, context: ResolvedSafeContext, owner: Address, config: RolesSetupConfig, options: TxBuildOptions, chainId: number): Promise<BuildTxBucketsResult>;
//# sourceMappingURL=build.d.ts.map