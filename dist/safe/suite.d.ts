import { Address, Hex, type PublicClient } from 'viem';
import { type GetNonceResult, type GetThresholdResult, type GetModulesResult, type IsModuleEnabledResult, type CalculateSafeAddressResult, type IsSafeDeployedResult, type BuildTxResult, type GetVersionResult, type SafeVersion, type GetOwnersResult, type IsOwnerResult, type BuildMetaTxResult, type GetSafeTxHashResult, type SafeTransactionData, type IsTxReadyResult, OperationType, BuildSignSafeTx, MetaTransactionData } from '@sdk/types';
export declare class SafeSuite {
    client: PublicClient;
    constructor(publicClient: PublicClient);
    calculateSafeAddress(owners: Address[], saltNonce: bigint): Promise<CalculateSafeAddressResult>;
    getNonce(safe: Address): Promise<GetNonceResult>;
    getThreshold(safe: Address): Promise<GetThresholdResult>;
    getModulesForSafe(safe: Address): Promise<GetModulesResult>;
    isModuleEnabled(safe: Address, module: Address): Promise<IsModuleEnabledResult>;
    isSafeDeployed(owners: Address[], saltNonce: bigint): Promise<IsSafeDeployedResult>;
    buildSafeDeploymentTx(owner: Address, saltNonce: bigint): Promise<BuildTxResult>;
    getVersion(safe: Address): Promise<GetVersionResult>;
    getOwners(safe: Address): Promise<GetOwnersResult>;
    isOwner(safe: Address, owner: Address): Promise<IsOwnerResult>;
    buildRawEnableModuleMetaTx(safe: Address, module: Address): Promise<MetaTransactionData>;
    buildEnableModuleTx(safe: Address, module: Address): Promise<BuildSignSafeTx>;
    buildDisableModuleTx(safe: Address, prevModule: Address, module: Address): Promise<BuildSignSafeTx>;
    getSafeTransactionHash(safe: Address, tx: SafeTransactionData, version: SafeVersion, chainId: number): Promise<GetSafeTxHashResult>;
    isTransactionReady(safe: Address, hash: Hex, txData: Hex, signatures: Hex[], threshold: bigint): Promise<IsTxReadyResult>;
    buildExecTransaction(safe: Address, tx: SafeTransactionData, signatures: Hex): Promise<BuildMetaTxResult>;
    private buildSafeTransactionData;
    private resolveNonce;
    buildSignSafeTx(safe: Address, to: Address, data: Hex, operation?: OperationType, isSafeDeployed?: boolean): Promise<BuildSignSafeTx>;
}
//# sourceMappingURL=suite.d.ts.map