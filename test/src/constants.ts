import { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export const account = privateKeyToAccount(process.env.PRIVATE_KEY as Hex);

export const SALT_NONCE: bigint =
  49283958031592751846843999922154915478711148540285783292619928679561501982457n;

export const DEPLOYED_SALT_NONCE: bigint =
  90930321156822575619585299798051942649965792527247609848192735196178265489997n;
