import { type PublicClient, type Address } from 'viem';

export async function isContractDeployed(
  client: PublicClient,
  address: Address
): Promise<boolean> {
  const code = await client.getCode({ address });
  return !!(code && code !== '0x');
}

export async function match<
  T extends { status: string },
  R,
  K extends T['status'] = T['status']
>(
  value: T,
  handlers: { [P in K]: (val: Extract<T, { status: P }>) => R | Promise<R> }
): Promise<R> {
  const handler = handlers[value.status as K];
  if (!handler) throw new Error(`Unhandled case: ${value.status}`);
  return await handler(value as any);
}
