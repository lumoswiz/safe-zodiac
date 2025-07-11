import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const account = privateKeyToAccount(
  process.env.PRIVATE_KEY_ANVIL as Hex
);
