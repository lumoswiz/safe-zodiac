import { beforeAll, beforeEach, afterAll } from 'bun:test';
import { server, getRpcUrl } from './src/anvil';
import { testConfig } from './config';

beforeAll(async () => {
  await server.start();
  testConfig.rpcUrl = getRpcUrl();
});

beforeEach(async () => {
  await fetch(`${testConfig.rpcUrl}/restart`, {
    headers: { Connection: 'close' },
  });
});

afterAll(async () => {
  await fetch(`${testConfig.rpcUrl}/stop`, {
    headers: { Connection: 'close' },
  });
  await server.stop();
});
