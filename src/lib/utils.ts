import { type PublicClient, type Address, Hex } from 'viem';
import {
  BuildTxResult,
  MetaTransactionData,
  OperationType,
  Result,
} from '../types';

export async function isContractDeployed(
  client: PublicClient,
  address: Address
): Promise<boolean> {
  const code = await client.getCode({ address });
  return !!(code && code !== '0x');
}

export function toMetaTx(tx: {
  to: Address;
  data: Hex;
  operation?: OperationType;
}): MetaTransactionData {
  return {
    to: tx.to,
    data: tx.data,
    value: '0x00',
    operation: tx.operation ?? OperationType.Call,
  };
}

export function unwrapOrFail<R, E>(
  res: Result<R, E>
): R | (E & { _isError: true }) {
  if (res.status === 'ok') return res.value;
  return { ...res.error, _isError: true };
}

export const maybeError = <T>(
  val: T | { _isError: true }
): val is { _isError: true } =>
  !!val && typeof val === 'object' && '_isError' in val;

export function makeOk<T, E = unknown>(value: T): Result<T, E> {
  return { status: 'ok', value };
}

export function makeError<T = unknown>(error: T): Result<never, T> {
  return { status: 'error', error };
}

export function makeOptional<T, E = unknown>(value?: T): Result<T | null, E> {
  return makeOk(value ?? null);
}

export async function matchResult<
  T extends { status: 'ok'; value: any } | { status: 'error'; error: any },
  R
>(
  result: T,
  handlers: {
    ok: (value: Extract<T, { status: 'ok' }>) => R | Promise<R>;
    error: (error: Extract<T, { status: 'error' }>) => R | Promise<R>;
  }
): Promise<R> {
  if (result.status === 'ok') {
    return handlers.ok(result as any);
  } else {
    return handlers.error(result as any);
  }
}

export function mapResult<T, U, E>(
  res: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  return res.status === 'ok' ? makeOk(fn(res.value)) : res;
}

export async function flatMapResult<T, E, U>(
  promise: Promise<Result<T, E>>,
  fn: (value: T) => Result<U, E> | Promise<Result<U, E>>
): Promise<Result<U, E>> {
  const res = await promise;
  if (res.status === 'error') return res;
  return fn(res.value);
}

export function extractOptionalMetaTx(
  result: Promise<BuildTxResult>
): Promise<Result<MetaTransactionData | null>> {
  return flatMapResult(result, (value) => {
    switch (value.kind) {
      case 'built':
        return makeOptional(value.tx);
      case 'skipped':
        return makeOptional();
    }
  });
}
