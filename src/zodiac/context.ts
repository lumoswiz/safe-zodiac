import { Address, isAddressEqual } from 'viem';
import { ResolvedSafeContext, Result } from '../types';
import { SafeSuite } from '../safe';
import {
  isContractDeployed,
  makeError,
  makeOk,
  matchResult,
} from '../shared/utils';

export async function resolveSafeContext(
  safeSuite: SafeSuite,
  safe: Address,
  owner: Address,
  maybeSaltNonce: bigint | undefined
): Promise<Result<ResolvedSafeContext>> {
  const deployed = await isContractDeployed(safeSuite.client, safe);

  if (deployed) {
    const ownersResult = await safeSuite.getOwners(safe);
    return matchResult(ownersResult, {
      ok: ({ value: owners }) => {
        const [onlyOwner] = owners;
        if (
          !onlyOwner ||
          owners.length !== 1 ||
          !isAddressEqual(onlyOwner, owner)
        ) {
          return makeError(
            new Error('Safe is not a valid 1/1 owner configuration.')
          );
        }

        return makeOk({
          safeAddress: safe,
          saltNonce: null,
          deployed: true,
        });
      },
      error: ({ error }) => makeError(error),
    });
  }

  if (maybeSaltNonce !== undefined) {
    const predictedRes = await safeSuite.calculateSafeAddress(
      [owner],
      maybeSaltNonce
    );

    return matchResult(predictedRes, {
      ok: ({ value: predictedAddress }) => {
        if (!isAddressEqual(predictedAddress, safe)) {
          return makeError(
            new Error(
              `Provided Safe address (${safe}) does not match predicted CREATE2 address (${predictedAddress})`
            )
          );
        }

        return makeOk({
          safeAddress: predictedAddress,
          saltNonce: maybeSaltNonce,
          deployed: false,
        });
      },
      error: ({ error }) => makeError(error),
    });
  }

  return makeError(
    new Error('Safe is not deployed and no saltNonce was provided.')
  );
}
