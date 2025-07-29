import { Address, Hex, PublicClient } from 'viem';
import { RolesSuite } from '../roles/suite';
import { Result, ExecFullSetupTxArgs } from '@sdk/types';
import { SafeSuite } from '../safe';
export declare class ZodiacSuite {
    readonly safeSuite: SafeSuite;
    readonly rolesSuite: RolesSuite;
    private readonly execStrategies;
    constructor(publicClient: PublicClient);
    getPredictedSafeAddress(owner: Address, saltNonce: bigint): Promise<Address>;
    getPredictedRolesAddress(safe: Address, saltNonce: bigint): Promise<Address>;
    execFullSetupTx({ safe, account, maybeSaltNonce, config, options, executionMode, }: ExecFullSetupTxArgs): Promise<Result<Hex[]>>;
}
//# sourceMappingURL=suite.d.ts.map