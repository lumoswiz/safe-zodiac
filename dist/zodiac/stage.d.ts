import { DetermineStartStageArgs } from '@sdk/types';
export declare function determineStartStage({ safeSuite, rolesSuite, context, config, chainId, }: DetermineStartStageArgs): Promise<{
    status: "error";
    error: unknown;
} | {
    status: "ok";
    value: unknown;
}>;
//# sourceMappingURL=stage.d.ts.map