import { Account, Hex } from 'viem';
import { SafeSuite } from '../safe';
import { ExecStrategies, ExecutionMode, ResolvedSafeContext, Result, RolesSetupConfig, TxBuildOptions } from '@sdk/types';
import { RolesSuite } from '../roles/suite';
export declare function orchestrateFullSetup(safeSuite: SafeSuite, rolesSuite: RolesSuite, context: ResolvedSafeContext, account: Account, config: RolesSetupConfig, options: TxBuildOptions, executionMode: ExecutionMode, strategies: ExecStrategies): Promise<Result<Hex[]>>;
//# sourceMappingURL=orchestrate.d.ts.map