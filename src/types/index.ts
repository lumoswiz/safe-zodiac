import {
  type Address,
  type Hex,
  type ParseAbi,
  type TypedDataDomain,
  type TypedDataParameter,
} from 'viem';

export interface Deployment {
  abi: unknown[] | ParseAbi<readonly string[]>;
  address: Address;
}

export enum OperationType {
  Call = 0,
  DelegateCall = 1,
}

export interface MetaTransactionData {
  readonly to: Address;
  readonly value: Hex;
  readonly data: Hex;
  readonly operation?: OperationType;
}

export interface SafeTransactionData extends MetaTransactionData {
  operation: OperationType;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: Address;
  refundReceiver: Address;
  nonce: bigint;
}

export type TypedMessageTypes = Record<string, TypedDataParameter[]>;

export interface EIP712TypedData {
  domain: TypedDataDomain;
  types: TypedMessageTypes;
  message: Record<string, unknown>;
  primaryType: string;
}

export interface EIP712TxTypes {
  EIP712Domain: TypedDataParameter[];
  SafeTx: TypedDataParameter[];
}

export interface SafeEIP712Args {
  safeAddress: Address;
  safeVersion: string;
  chainId: number;
  data: SafeTransactionData | EIP712TypedData | Hex;
}
