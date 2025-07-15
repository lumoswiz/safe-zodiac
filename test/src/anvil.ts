import { createServer } from 'prool';
import { anvil } from 'prool/instances';
import { CHAIN_ID, FORK_URL, FORK, PORT } from '../config';

export const server = createServer({
  instance: anvil({
    chainId: CHAIN_ID,
    forkUrl: FORK_URL,
  }),
  port: PORT,
  limit: FORK,
});

export function getRpcUrl(): string {
  const { port } = server.address()!;
  return `http://localhost:${port}/${FORK}`;
}
