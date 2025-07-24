import { type Address } from 'viem';

export const EQ_OR_GT_1_3_0 = '>=1.3.0';

export const SAFE_VERSIONS = [
  '1.4.1',
  '1.3.0',
  '1.2.0',
  '1.1.1',
  '1.0.0',
] as const;

export const ZERO_ADDRESS: Address =
  '0x0000000000000000000000000000000000000000';

export const SAFE_PROXY_FACTORY: Address =
  '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67';

export const SAFE_SINGLETON: Address =
  '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762';
