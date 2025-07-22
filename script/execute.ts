import {
  Address,
  createPublicClient,
  Hex,
  http,
  PublicClient,
  encodeAbiParameters,
  parseAbiParameters,
  walletActions,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { ZodiacSafeSuite } from '../src/zodiac-safe';
import { ExecutionOptions, ParameterType, Operator } from '../src/types';
import {
  account,
  ROLE_KEY,
  SUPPLY_SELECTOR,
  TARGET,
  WETH,
} from '../test/src/constants';
import { maybeError, unwrapOrFail } from '../src/lib/utils';

(async () => {
  const FORK_URL = process.env.FORK_URL!;
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(FORK_URL),
  });

  const suite = new ZodiacSafeSuite(publicClient as PublicClient);

  const safeAddress: Address = '0x760c3b3dd615807deE12803091493f7E43A7613a';
  const owner: Address = '0x5DFA9B19235D93111D863b5F7e4508b32FDF915B';
  const ROLE_MEMBER: Address = '0x4AAC49716981a089b28d59eDF32579ca96243727';
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

  const buildResult = await suite.buildAllTx(
    safeAddress,
    owner,
    safeNonce,
    rolesSetup
  );

  const unwrapped = unwrapOrFail(buildResult);
  if (maybeError(unwrapped)) throw unwrapped;
  const { setupTxs, multisendTxs } = unwrapped;

  if (setupTxs.length > 0) {
    console.log(`📦 Executing ${setupTxs.length} setup transaction(s)...`);
    for (const tx of setupTxs) {
      const hash = await publicClient.extend(walletActions).sendTransaction({
        account,
        to: tx.to,
        data: tx.data,
        value: BigInt(tx.value),
      });
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`✅ Setup tx confirmed: ${hash}`);
    }
  }

  if (multisendTxs.length > 0) {
    const metaTxs = multisendTxs.map((tx) => ({
      to: tx.to,
      value: tx.value,
      data: tx.data,
      operation: tx.operation,
    }));

    const signed = await suite.signMultisendTx(safeAddress, metaTxs, account);
    const signedTx = unwrapOrFail(signed);
    if (maybeError(signedTx)) throw signedTx;

    const { txData, signature } = signedTx;
    const execRes = await suite.execTx(safeAddress, txData, signature, account);
    const execOutcome = unwrapOrFail(execRes);
    if (maybeError(execOutcome)) throw execOutcome;

    console.log('✅ Multisend bundle executed successfully');
  }

  console.log(
    JSON.stringify(
      { setupTxs, multisendTxs },
      (_k, v) => (typeof v === 'bigint' ? v.toString() : v),
      2
    )
  );
})();
