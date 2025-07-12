import { Hex, type Address } from 'viem';

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

export const ROLES_V2_MODULE_MASTERCOPY: Address =
  '0x9646fDAD06d3e24444381f44362a3B0eB343D337';

export const MODULE_PROXY_FACTORY: Address =
  '0x000000000000aDdB49795b0f9bA5BC298cDda236';

export const SAFE_PROXY_FACTORY: Address =
  '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67';

export const SAFE_SINGLETON: Address =
  '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762';

export const SAFE_NETWORKS: { [chainId: number]: string } = {
  1: 'mainnet',
  10: 'optimism',
  56: 'binance',
  97: 'bsc-testnet',
  100: 'gnosis-chain',
  130: 'unichain',
  137: 'polygon',
  146: 'sonic',
  42161: 'arbitrum',
  43113: 'avalanche-fuji',
  43114: 'avalanche',
  480: 'world-chain',
  80001: 'polygon-mumbai',
  8453: 'base',
  11155111: 'sepolia',
};

export const PROXY_BYTECODE_PREFIX: Hex =
  '0x602d8060093d393df3363d3d373d3d3d363d73';

export const PROXY_BYTECODE_SUFFIX: Hex = '0x5af43d82803e903d91602b57fd5bf3';
