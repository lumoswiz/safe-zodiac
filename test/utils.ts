import { Account, Address, Hex, walletActions } from 'viem';
import { SafeContractSuite } from '../src/lib/safe';
import { Result, SafeTransactionData } from '../src/types';
import { generateSafeTypedData } from '../src/lib/safe-eip712';
import { match } from '../src/lib/utils';

export function unwrap<T>(res: Result<T>): T {
  if (res.status === 'ok') return res.value;
  throw new Error(`Expected ok, got ${res.status}: ${res.error}`);
}

export async function sign(
  suite: SafeContractSuite,
  safeAddress: Address,
  txData: SafeTransactionData,
  account: Account
): Promise<Hex> {
  const version = unwrap(await suite.getVersion(safeAddress));
  const chainId = await suite.client.getChainId();
  const typedData = generateSafeTypedData({
    safeAddress,
    safeVersion: version,
    chainId,
    data: txData,
  });
  const signature: Hex = await suite.client
    .extend(walletActions)
    .signTypedData({
      account,
      domain: typedData.domain,
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message,
    });
  return signature;
}

export async function signAndExec(
  suite: SafeContractSuite,
  safeAddress: Address,
  txData: SafeTransactionData,
  account: Account
) {
  const signature: Hex = await sign(suite, safeAddress, txData, account);

  await match(
    await suite.buildExecTransaction(safeAddress, txData, signature),
    {
      error: ({ error }) => {
        throw new Error(`Could not build execTransaction call: ${error}`);
      },
      ok: async ({ value: { to, data, value } }) => {
        await suite.client.extend(walletActions).sendTransaction({
          account,
          chain: null,
          to,
          data,
          value: BigInt(value),
        });
      },
    }
  );
}
