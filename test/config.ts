import getPort from 'get-port';
import { foundry } from 'viem/chains';

export const CHAIN_ID = foundry.id;
export const FORK_URL = process.env.FORK_URL!;
export const FORK = Number(process.env.BUN_WORKER_ID ?? 1);
export const PORT = process.env.ANVIL_PORT
  ? Number(process.env.ANVIL_PORT)
  : await getPort();
export const testConfig = {
  rpcUrl: '' as string,
};
