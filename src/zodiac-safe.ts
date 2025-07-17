import {
  Address,
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  isAddressEqual,
  PublicClient,
} from 'viem';
import { SafeContractSuite } from './lib/safe';
import { ZodiacRolesSuite } from './lib/roles';
import {
  BuildMetaTxArrayResult,
  GetOwnersResult,
  IsValidSafeResult,
  MetaTransactionData,
  Result,
  EnsureSafeResult,
  BuildTxResult,
  EnsureRolesResult,
  IsModuleDeployedResult,
  CalculateModuleProxyAddressResult,
} from './types';
import { match, maybeError, unwrapOrFail } from './lib/utils';

export class ZodiacSafeSuite {
  readonly client: PublicClient;
  readonly safeSuite: SafeContractSuite;
  readonly rolesSuite: ZodiacRolesSuite;
  private static readonly DEFAULT_ROLES_NONCE: bigint =
    46303759331860629381431170770107494699648271559618626860680275899814502026071n;

  constructor(publicClient: PublicClient) {
    this.client = publicClient;
    this.safeSuite = new SafeContractSuite(publicClient);
    this.rolesSuite = new ZodiacRolesSuite(publicClient);
  }

  private async buildAllTx(
    safe: Address | undefined,
    owner: Address,
    safeNonce: bigint,
    rolesNonce: bigint = ZodiacSafeSuite.DEFAULT_ROLES_NONCE
  ): Promise<BuildMetaTxArrayResult> {
    const allMetaTxs: MetaTransactionData[] = [];

    const safeEnsured = await this.ensureSingleOwnerSafe(
      safe,
      owner,
      safeNonce
    );
    const safeVal = unwrapOrFail(safeEnsured);
    if (maybeError(safeVal)) return { status: 'error', error: safeVal };

    const { safeAddress, metaTxs: safeTxs } = safeVal;
    allMetaTxs.push(...safeTxs);

    const rolesEnsured = await this.ensureRolesModule(safeAddress, rolesNonce);
    const rolesVal = unwrapOrFail(rolesEnsured);
    if (maybeError(rolesVal)) return { status: 'error', error: rolesVal };

    const { rolesAddress, metaTxs: rolesTxs } = rolesVal;
    allMetaTxs.push(...rolesTxs);

    return { status: 'ok', value: allMetaTxs };
  }

  private async ensureSingleOwnerSafe(
    safe: Address | undefined,
    owner: Address,
    safeNonce: bigint
  ): Promise<EnsureSafeResult> {
    const resolved =
      safe ??
      unwrapOrFail(
        await this.safeSuite.calculateSafeAddress([owner], safeNonce)
      );
    if (maybeError(resolved)) {
      return { status: 'error', error: resolved };
    }

    const validityRes = await match<IsValidSafeResult, Result<boolean>>(
      await this.isValidSafe(resolved, owner),
      {
        ok: ({ value }) => ({ status: 'ok', value }),
        error: ({ error }) => {
          if (
            error instanceof ContractFunctionRevertedError ||
            error instanceof ContractFunctionExecutionError
          ) {
            return { status: 'ok', value: false };
          }
          return { status: 'error', error };
        },
      }
    );

    const isValid = unwrapOrFail(validityRes);
    if (maybeError(isValid)) {
      return { status: 'error', error: isValid };
    }

    if (!isValid) {
      const deployRes = await this.safeSuite.buildSafeDeploymentTx(
        owner,
        safeNonce
      );

      const errOrTx = await match<
        BuildTxResult,
        null | MetaTransactionData | unknown
      >(deployRes, {
        built: ({ tx }) => tx,
        skipped: () => null,
        error: ({ error }) => error,
      });

      if (errOrTx && typeof errOrTx !== 'object') {
        return { status: 'error', error: errOrTx };
      }

      const metaTxs = errOrTx ? [errOrTx as MetaTransactionData] : [];
      return { status: 'ok', value: { safeAddress: resolved, metaTxs } };
    }

    return { status: 'ok', value: { safeAddress: resolved, metaTxs: [] } };
  }

  private async isValidSafe(
    safe: Address,
    owner: Address
  ): Promise<IsValidSafeResult> {
    return match<GetOwnersResult, IsValidSafeResult>(
      await this.safeSuite.getOwners(safe),
      {
        ok: ({ value: owners }) => {
          const [onlyOwner] = owners;
          if (!onlyOwner || owners.length !== 1) {
            return { status: 'ok', value: false };
          }
          return {
            status: 'ok',
            value: isAddressEqual(owner, onlyOwner),
          };
        },
        error: ({ error }) => ({ status: 'error', error }),
      }
    );
  }

  private async ensureRolesModule(
    safe: Address,
    rolesNonce: bigint = ZodiacSafeSuite.DEFAULT_ROLES_NONCE
  ): Promise<EnsureRolesResult> {
    const addrRes = await match<
      CalculateModuleProxyAddressResult,
      Result<Address>
    >(this.rolesSuite.calculateModuleProxyAddress(safe, rolesNonce), {
      ok: ({ value }) => ({ status: 'ok', value }),
      error: ({ error }) => ({ status: 'error', error }),
    });

    const rolesAddress = unwrapOrFail(addrRes);
    if (maybeError(rolesAddress))
      return { status: 'error', error: rolesAddress };

    const deployedRes = await match<IsModuleDeployedResult, Result<boolean>>(
      await this.rolesSuite.isModuleDeployed(safe, rolesNonce),
      {
        ok: ({ value }) => ({ status: 'ok', value }),
        error: ({ error }) => ({ status: 'error', error }),
      }
    );

    const isDeployed = unwrapOrFail(deployedRes);
    if (maybeError(isDeployed)) return { status: 'error', error: isDeployed };

    if (isDeployed) {
      return { status: 'ok', value: { rolesAddress, metaTxs: [] } };
    }

    const buildRes = await match<
      BuildTxResult,
      Result<MetaTransactionData | null>
    >(await this.rolesSuite.buildDeployModuleTx(safe, rolesNonce), {
      built: ({ tx }) => ({ status: 'ok', value: tx }),
      skipped: () => ({ status: 'ok', value: null }), // shouldn’t fire now
      error: ({ error }) => ({ status: 'error', error }),
    });

    const txOrNull = unwrapOrFail(buildRes);
    if (maybeError(txOrNull)) return { status: 'error', error: txOrNull };

    const metaTxs = txOrNull ? [txOrNull] : [];
    return { status: 'ok', value: { rolesAddress, metaTxs } };
  }
}
