import { type PublicClient, type Address } from 'viem';
import { Result } from '../types';

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

export function unwrapOrFail<R, E>(
  res: Result<R, E>
): R | (E & { _isError: true }) {
  if (res.status === 'ok') return res.value;
  return { ...res.error, _isError: true };
}

export const maybeError = <T>(
  val: T | { _isError: true }
): val is { _isError: true } => (val as any)._isError;

export async function expectValue<T>(p: Promise<Result<T>>): Promise<T> {
  const r = await p;
  const v = unwrapOrFail(r);
  if (maybeError(v)) throw v;
  return v;
}
