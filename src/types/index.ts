import { Address, ParseAbi } from 'viem';

export interface Deployment {
  abi: unknown[] | ParseAbi<readonly string[]>;
  address: Address;
}

export * from './result';
export * from './safe';
