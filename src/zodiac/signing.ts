import { Account, Address, Hex, walletActions } from 'viem';
import {
  MetaTransactionData,
  Result,
  SAFE_VERSION_FALLBACK,
  SafeTransactionData,
} from '@sdk/types';
import { makeError, makeOk, matchResult } from '../shared/utils';
import { encodeMulti, generateSafeTypedData, SafeSuite } from '../safe';

export async function signTx(
  safeSuite: SafeSuite,
  safeAddress: Address,
  txData: SafeTransactionData,
  account: Account
): Promise<Result<Hex>> {
  const versionResult = await safeSuite.getVersion(safeAddress);

  return matchResult(versionResult, {
    error: ({ error }) => makeError(error),

    ok: async ({ value: version }) => {
      try {
        const chainId = await safeSuite.client.getChainId();

        const typedData = generateSafeTypedData({
          safeAddress,
          safeVersion: version,
          chainId,
          data: txData,
        });

        const signature = await safeSuite.client
          .extend(walletActions)
          .signTypedData({
            account,
            domain: typedData.domain,
            types: typedData.types,
            primaryType: typedData.primaryType,
            message: typedData.message,
          });

        return makeOk(signature);
      } catch (error) {
        return makeError(error);
      }
    },
  });
}

export async function signMultisendTx(
  safeSuite: SafeSuite,
  safe: Address,
  multisendTxs: MetaTransactionData[],
  account: Account,
  IsSafeDeployed: boolean = true
): Promise<Result<{ txData: SafeTransactionData; signature: Hex }>> {
  const multisendTx = encodeMulti(multisendTxs);

  const signResult = await safeSuite.buildSignSafeTx(
    safe,
    multisendTx.to,
    multisendTx.data,
    multisendTx.operation,
    IsSafeDeployed
  );

  return matchResult(signResult, {
    error: ({ error }) => makeError(error),
    ok: async ({ value: { txData } }) => {
      try {
        const version = IsSafeDeployed
          ? await matchResult(await safeSuite.getVersion(safe), {
              ok: ({ value }) => value,
              error: () => SAFE_VERSION_FALLBACK,
            })
          : SAFE_VERSION_FALLBACK;
        const chainId = await safeSuite.client.getChainId();

        const typedData = generateSafeTypedData({
          safeAddress: safe,
          safeVersion: version,
          chainId,
          data: txData,
        });

        const signature = await safeSuite.client
          .extend(walletActions)
          .signTypedData({
            account,
            domain: typedData.domain,
            types: typedData.types,
            primaryType: typedData.primaryType,
            message: typedData.message,
          });

        return makeOk({ txData, signature });
      } catch (error) {
        return makeError(error);
      }
    },
  });
}
