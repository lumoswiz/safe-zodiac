import { Address, createPublicClient, Hex, http, PublicClient } from 'viem';
import { baseSepolia } from 'viem/chains';
import { ZodiacSafeSuite } from '../src/zodiac-safe';
import {
  ExecutionOptions,
  ParameterType,
  Operator,
  MetaTransactionData,
} from '../src/types';
import { ROLE_KEY, SUPPLY_SELECTOR, TARGET, WETH } from '../test/src/constants';
import { encodeAbiParameters, parseAbiParameters } from 'viem';
import { expectValue, maybeError, unwrapOrFail } from '../src/lib/utils';
import { encodeMulti } from '../src/lib/multisend';

(async () => {
  const FORK_URL = process.env.FORK_URL!;

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(FORK_URL),
  });

  const ROLE_MEMBER: Address = '0x4AAC49716981a089b28d59eDF32579ca96243727';

  const suite = new ZodiacSafeSuite(publicClient as PublicClient);

  const safeAddress = '0x213B2Dbf21F105BfC21d7CA3F5cBe920Da9A816f';
  const owner = '0x5DFA9B19235D93111D863b5F7e4508b32FDF915B';
  const safeNonce = 13n;

  const conditions = [
    {
      parent: 0,
      paramType: ParameterType.Calldata,
      operator: Operator.Matches,
      compValue: '0x' as Hex,
    },
    {
      parent: 0,
      paramType: ParameterType.Static,
      operator: Operator.EqualTo,
      compValue: encodeAbiParameters(parseAbiParameters('address'), [
        WETH,
      ]) as Hex,
    },
    {
      parent: 0,
      paramType: ParameterType.Static,
      operator: Operator.Pass,
      compValue: '0x' as Hex,
    },
    {
      parent: 0,
      paramType: ParameterType.Static,
      operator: Operator.EqualTo,
      compValue: encodeAbiParameters(parseAbiParameters('address'), [
        owner,
      ]) as Hex,
    },
    {
      parent: 0,
      paramType: ParameterType.Static,
      operator: Operator.Pass,
      compValue: '0x' as Hex,
    },
  ];

  const rolesSetup = {
    member: ROLE_MEMBER,
    roleKey: ROLE_KEY,
    target: TARGET,
    scopes: [
      {
        selectors: SUPPLY_SELECTOR,
        conditions,
        execOpts: ExecutionOptions.Send,
      },
    ],
  };

  const result = await suite.buildAllTx(
    safeAddress,
    owner,
    safeNonce,
    rolesSetup
  );

  const value = unwrapOrFail(result);
  if (maybeError(value)) throw value;
  const { setupTxs, multisendTxs } = value;

  const metaTxs: MetaTransactionData[] = multisendTxs.map((tx) => ({
    to: tx.to,
    value: tx.value,
    data: tx.data,
    operation: tx.operation,
  }));

  const multisendBundleTx = encodeMulti(metaTxs);

  console.log(multisendBundleTx);

  console.log(
    JSON.stringify(
      result,
      (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
      2
    )
  );
})();
