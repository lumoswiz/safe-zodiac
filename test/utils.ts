import { Account, Address, Hex, PublicClient, walletActions } from 'viem';
import { SafeContractSuite } from '../src/lib/safe';
import { ZodiacRolesSuite } from '../src/lib/roles';
import { Result, SafeTransactionData } from '../src/types';
import { generateSafeTypedData } from '../src/lib/safe-eip712';
import { match } from '../src/lib/utils';
import { account, DEPLOYED_SALT_NONCE } from './src/constants';

export function expectOk<T, E>(res: Result<T, E>, label = 'Expected ok'): T {
  if (res.status === 'ok') return res.value;
  throw new Error(`${label}, got error: ${String(res.error)}`);
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

export async function deploySafe(
  publicClient: PublicClient,
  owners: Address[] = [account.address],
  saltNonce: bigint = DEPLOYED_SALT_NONCE
): Promise<{ safeAddress: Address; suite: SafeContractSuite }> {
  const suite = new SafeContractSuite(publicClient);

  const safeAddress = expectOk(
    await suite.calculateSafeAddress(owners, saltNonce),
    'Failed to calculate Safe address'
  );

  const txRes = await suite.buildSafeDeploymentTx(owners[0], saltNonce);

  if (txRes.status === 'error') {
    const errorMsg =
      txRes.error instanceof Error ? txRes.error.message : String(txRes.error);
    throw new Error(`Failed to build deployment tx: ${errorMsg}`);
  }

  if (txRes.value.kind === 'skipped') {
  } else if (txRes.value.kind === 'built') {
    const { to, data, value } = txRes.value.tx;
    const hash = await publicClient.extend(walletActions).sendTransaction({
      account,
      chain: null,
      to,
      data,
      value: BigInt(value),
    });
    await publicClient.waitForTransactionReceipt({ hash });
  } else {
    throw new Error(`Unexpected tx kind: ${(txRes.value as any).kind}`);
  }

  return { safeAddress, suite };
}

export async function deployRoles(
  publicClient: PublicClient,
  safeAddress: Address,
  saltNonce: bigint = DEPLOYED_SALT_NONCE
): Promise<{
  rolesAddress: Address;
  suite: ZodiacRolesSuite;
}> {
  const suite = new ZodiacRolesSuite(publicClient);

  const rolesAddress = unwrap(
    suite.calculateModuleProxyAddress(safeAddress, saltNonce)
  );

  const txRes = await suite.buildDeployModuleTx(safeAddress, saltNonce);

  await match(txRes, {
    error: ({ error }) => {
      throw new Error(error instanceof Error ? error.message : String(error));
    },
    skipped: () => {
      return;
    },
    built: async ({ tx }) => {
      const hash = await publicClient.extend(walletActions).sendTransaction({
        account,
        chain: null,
        to: tx.to,
        data: tx.data,
        value: BigInt(tx.value),
      });

      await publicClient.waitForTransactionReceipt({ hash });
    },
  });

  return { rolesAddress, suite };
}

export async function deploySafeWithRoles(
  publicClient: PublicClient,
  saltNonce: bigint = DEPLOYED_SALT_NONCE
): Promise<{
  safeAddress: Address;
  rolesAddress: Address;
  safeSuite: SafeContractSuite;
  rolesSuite: ZodiacRolesSuite;
}> {
  const { safeAddress, suite: safeSuite } = await deploySafe(
    publicClient,
    [account.address],
    saltNonce
  );

  const { rolesAddress, suite: rolesSuite } = await deployRoles(
    publicClient,
    safeAddress,
    saltNonce
  );

  await match(await safeSuite.buildEnableModuleTx(safeAddress, rolesAddress), {
    error: ({ error }) => {
      throw new Error(`Could not build enableModule tx: ${error}`);
    },
    ok: async ({ value: { txData } }) => {
      await signAndExec(safeSuite, safeAddress, txData, account);
    },
  });

  const enabled = unwrap(
    await safeSuite.isModuleEnabled(safeAddress, rolesAddress)
  );
  if (!enabled) {
    throw new Error('Roles module failed to enable on the Safe');
  }

  return { safeAddress, rolesAddress, safeSuite, rolesSuite };
}

export async function deployAndSetupRoles(
  publicClient: PublicClient,
  {
    member,
    roleKeys,
    memberOf,
    saltNonce = DEPLOYED_SALT_NONCE,
  }: {
    member: Address;
    roleKeys: Hex[];
    memberOf: boolean[];
    saltNonce?: bigint;
  }
): Promise<{
  safeAddress: Address;
  rolesAddress: Address;
  safeSuite: SafeContractSuite;
  rolesSuite: ZodiacRolesSuite;
}> {
  const { safeAddress, rolesAddress, safeSuite, rolesSuite } =
    await deploySafeWithRoles(publicClient, saltNonce);

  await match(
    await rolesSuite.buildAssignRolesTx(
      rolesAddress,
      member,
      roleKeys,
      memberOf
    ),
    {
      error: ({ error }) => {
        throw new Error(`Could not build Roles tx: ${error}`);
      },
      ok: async ({ value: { to, data } }) => {
        await match(await safeSuite.buildSignSafeTx(safeAddress, to, data), {
          error: ({ error }) => {
            throw new Error(`Could not wrap in Safe tx: ${error}`);
          },
          ok: async ({ value: { txData } }) => {
            await signAndExec(safeSuite, safeAddress, txData, account);
          },
        });
      },
    }
  );

  const enabled = unwrap(
    await safeSuite.isModuleEnabled(safeAddress, rolesAddress)
  );
  if (!enabled) {
    throw new Error('Roles module failed to stay enabled on the Safe');
  }

  return { safeAddress, rolesAddress, safeSuite, rolesSuite };
}
