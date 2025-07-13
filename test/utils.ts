import {
  Account,
  Address,
  Chain,
  Hex,
  type TestClient,
  walletActions,
} from 'viem';
import { getTransactionReceipt, mine } from 'viem/actions';
import { Result } from '../src/types';

export function unwrap<T>(res: Result<T>): T {
  if (res.status === 'ok') return res.value;
  throw new Error(`Expected ok, got ${res.status}: ${res.error}`);
}
