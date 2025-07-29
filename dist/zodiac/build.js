import { ExecutionOptions, SetupStage, } from '@sdk/types';
import { expectBuiltTx, makeOk, matchResult } from '../shared/utils';
import { DEFAULT_ROLES_NONCE } from './constants';
import { determineStartStage } from './stage';
export async function buildAllTx(safeSuite, rolesSuite, context, owner, config, options, chainId) {
    const { safeAddress, saltNonce } = context;
    const stageRes = await determineStartStage({
        safeSuite,
        rolesSuite,
        context,
        config,
        chainId,
    });
    const startAt = await matchResult(stageRes, {
        ok: ({ value }) => value,
        error: ({ error }) => Promise.reject(error),
    });
    if (startAt === SetupStage.NothingToDo) {
        return makeOk({ setupTxs: [], multisendTxs: [] });
    }
    validateSetupArgs(startAt, config.rolesSetup);
    const allBuckets = await buildInitialSetupTxs({
        safeSuite,
        rolesSuite,
        safeAddress,
        owner,
        safeNonce: saltNonce ?? 0n,
        config,
        options,
        startAt,
    });
    return makeOk(allBuckets);
}
function validateSetupArgs(startAt, setup) {
    if (startAt <= SetupStage.ScopeFunctions && !setup) {
        throw new Error('Missing rolesSetup');
    }
    if (startAt <= SetupStage.AssignRoles) {
        if (!setup?.member)
            throw new Error('AssignRoles requires `member`');
        if (!setup?.roleKey)
            throw new Error('AssignRoles requires `roleKey`');
    }
    if (startAt <= SetupStage.ScopeTarget) {
        if (!setup?.target)
            throw new Error('ScopeTarget requires `target`');
    }
    if (startAt <= SetupStage.ScopeFunctions) {
        if (!setup?.scopes)
            throw new Error('ScopeFunctions requires `scopes`');
    }
}
async function buildInitialSetupTxs(args) {
    const rolesNonce = args.config.rolesNonce ?? DEFAULT_ROLES_NONCE;
    const rolesSetup = args.config.rolesSetup;
    const setupTxs = [];
    const multisendTxs = [];
    const addrResult = args.rolesSuite.calculateModuleProxyAddress(args.safeAddress, rolesNonce);
    const rolesAddress = await matchResult(addrResult, {
        ok: ({ value }) => value,
        error: ({ error }) => Promise.reject(error),
    });
    const steps = {
        [SetupStage.DeploySafe]: async () => {
            setupTxs.push(await buildSafeDeployTx(args.safeSuite, args.owner, args.safeNonce));
        },
        [SetupStage.DeployModule]: async () => {
            setupTxs.push(await buildRolesDeployTx(args.rolesSuite, args.safeAddress, rolesNonce));
        },
        [SetupStage.EnableModule]: async () => {
            multisendTxs.push(await args.safeSuite.buildRawEnableModuleMetaTx(args.safeAddress, rolesAddress));
        },
        [SetupStage.AssignRoles]: async () => {
            if (!rolesSetup?.member || !rolesSetup?.roleKey) {
                throw new Error('member and roleKey required for AssignRoles');
            }
            multisendTxs.push(await buildAssignRolesTx(args.rolesSuite, rolesAddress, rolesSetup));
        },
        [SetupStage.ScopeTarget]: async () => {
            if (!rolesSetup?.target || !rolesSetup?.roleKey) {
                throw new Error('target and roleKey required for ScopeTarget');
            }
            multisendTxs.push(await buildScopeTargetTx(args.rolesSuite, rolesAddress, rolesSetup));
        },
        [SetupStage.ScopeFunctions]: async () => {
            if (!rolesSetup?.scopes || !rolesSetup?.target || !rolesSetup?.roleKey) {
                throw new Error('scopes, target, and roleKey required for ScopeFunctions');
            }
            for (const s of rolesSetup.scopes) {
                multisendTxs.push(await buildScopeFunctionTx(args.rolesSuite, rolesAddress, rolesSetup, s));
            }
        },
    };
    for (let stage = args.startAt; stage <= SetupStage.ScopeFunctions; stage++) {
        const step = steps[stage];
        if (step)
            await step();
    }
    setupTxs.push(...(args.options.extraSetupTxs || []));
    multisendTxs.push(...(args.options.extraMultisendTxs || []));
    return { setupTxs, multisendTxs };
}
async function buildSafeDeployTx(safeSuite, owner, nonce) {
    return expectBuiltTx(safeSuite.buildSafeDeploymentTx(owner, nonce), 'Safe deployment');
}
async function buildRolesDeployTx(rolesSuite, safeAddr, nonce) {
    return expectBuiltTx(rolesSuite.buildDeployModuleTx(safeAddr, nonce), 'Roles module deployment');
}
async function buildAssignRolesTx(rolesSuite, moduleAddr, setup) {
    const result = await rolesSuite.buildAssignRolesTx(moduleAddr, setup.member, [setup.roleKey], [true]);
    return matchResult(result, {
        ok: ({ value }) => value,
        error: ({ error }) => Promise.reject(error),
    });
}
async function buildScopeTargetTx(rolesSuite, moduleAddr, setup) {
    const result = await rolesSuite.buildScopeTargetTx(moduleAddr, setup.roleKey, setup.target);
    return matchResult(result, {
        ok: ({ value }) => value,
        error: ({ error }) => Promise.reject(error),
    });
}
async function buildScopeFunctionTx(rolesSuite, moduleAddr, setup, scope) {
    const result = await rolesSuite.buildScopeFunctionTx(moduleAddr, setup.roleKey, setup.target, scope.selectors, scope.conditions, scope.execOpts ?? ExecutionOptions.Send);
    return matchResult(result, {
        ok: ({ value }) => value,
        error: ({ error }) => Promise.reject(error),
    });
}
