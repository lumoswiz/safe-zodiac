import { Hex, type Address } from 'viem';

export const ROLES_V2_MODULE_MASTERCOPY: Address =
  '0x9646fDAD06d3e24444381f44362a3B0eB343D337';

export const MODULE_PROXY_FACTORY: Address =
  '0x000000000000aDdB49795b0f9bA5BC298cDda236';

export const CHAINS: Record<number, { name: string; prefix: string }> = {
  1: { name: 'mainnet', prefix: 'eth' },
  10: { name: 'optimism', prefix: 'oeth' },
  56: { name: 'binance', prefix: 'bnb' },
  97: { name: 'bsc-testnet', prefix: 'bnbt' },
  100: { name: 'gnosis-chain', prefix: 'gno' },
  130: { name: 'unichain', prefix: 'unichain' },
  137: { name: 'polygon', prefix: 'matic' },
  146: { name: 'sonic', prefix: 'sonic' },
  42161: { name: 'arbitrum', prefix: 'arb1' },
  43113: { name: 'avalanche-fuji', prefix: 'avaxt' },
  43114: { name: 'avalanche', prefix: 'avax' },
  480: { name: 'world-chain', prefix: 'world' },
  80001: { name: 'polygon-mumbai', prefix: 'matict' },
  8453: { name: 'base', prefix: 'base' },
  11155111: { name: 'sepolia', prefix: 'sep' },
};

export const PROXY_BYTECODE_PREFIX: Hex =
  '0x602d8060093d393df3363d3d373d3d3d363d73';

export const PROXY_BYTECODE_SUFFIX: Hex = '0x5af43d82803e903d91602b57fd5bf3';
