import type { MetaTransactionData, SafeVersion } from './safe';

export type BuildTxResult =
  | { status: 'skipped' }
  | { status: 'built'; tx: MetaTransactionData };

export type GetVersionResult =
  | { status: 'ok'; version: SafeVersion }
  | { status: 'unknown_version'; version: string };
