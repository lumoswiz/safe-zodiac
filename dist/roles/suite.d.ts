import { Address, Hex, type PublicClient } from 'viem';
import type { BuildMetaTxResult, BuildTxResult, CalculateModuleProxyAddressResult, IsModuleDeployedResult, IsModuleEnabledResult, ConditionFlat, ExecutionOptions } from '@sdk/types';
export declare class RolesSuite {
    client: PublicClient;
    constructor(publicClient: PublicClient);
    calculateModuleProxyAddress(safe: Address, saltNonce: bigint): CalculateModuleProxyAddressResult;
    isModuleDeployed(safe: Address, saltNonce: bigint): Promise<IsModuleDeployedResult>;
    buildDeployModuleTx(safe: Address, saltNonce: bigint): Promise<BuildTxResult>;
    private getModuleSetUpData;
    buildAssignRolesTx(module: Address, member: Address, roleKeys: Hex[], memberOf: boolean[]): Promise<BuildMetaTxResult>;
    isModuleEnabled(module: Address, member: Address): Promise<IsModuleEnabledResult>;
    buildScopeTargetTx(module: Address, roleKey: Hex, target: Address): Promise<BuildMetaTxResult>;
    buildScopeFunctionTx(module: Address, roleKey: Hex, target: Address, selector: Hex, conditions: ConditionFlat[], executionOpts: ExecutionOptions): Promise<BuildMetaTxResult>;
}
//# sourceMappingURL=suite.d.ts.map