import { Result } from '../src/types';

export function unwrap<T>(res: Result<T>): T {
  if (res.status === 'ok') return res.value;
  throw new Error(`Expected ok, got ${res.status}: ${res.error}`);
}
