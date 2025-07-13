import { anvil } from 'prool/instances';
import { foundry } from 'viem/chains';

export const RPC_URL = process.env.RPC_URL!;

export const anvilInstance = anvil({
  chainId: foundry.id,
  forkUrl: RPC_URL,
});
