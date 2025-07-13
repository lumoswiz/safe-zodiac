import { createPublicClient, createTestClient, http } from 'viem';
import { RPC_URL } from './src/anvil';
import { foundry } from 'viem/chains';

const transport = http();

export const testClient = createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport,
});

export const publicClient = createPublicClient({
  chain: foundry,
  transport,
});
