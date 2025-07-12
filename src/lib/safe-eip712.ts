import { satisfies } from 'semver';
import {
  hashTypedData,
  type TypedDataDomain,
  type TypedDataParameter,
} from 'viem';
import type {
  SafeEIP712Args,
  EIP712TypedData,
  TypedMessageTypes,
  EIP712TxTypes,
} from '../types';
import { EQ_OR_GT_1_3_0 } from './constants';

const EIP712_DOMAIN_WITH_CHAIN: TypedDataParameter[] = [
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

const EIP712_DOMAIN_NO_CHAIN: TypedDataParameter[] = [
  { name: 'verifyingContract', type: 'address' },
];

export function getEip712TxTypes(safeVersion: string): EIP712TxTypes {
  const withChainId = satisfies(safeVersion, EQ_OR_GT_1_3_0);
  return {
    EIP712Domain: withChainId
      ? EIP712_DOMAIN_WITH_CHAIN
      : EIP712_DOMAIN_NO_CHAIN,
    SafeTx: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'operation', type: 'uint8' },
      { name: 'safeTxGas', type: 'uint256' },
      { name: 'baseGas', type: 'uint256' },
      { name: 'gasPrice', type: 'uint256' },
      { name: 'gasToken', type: 'address' },
      { name: 'refundReceiver', type: 'address' },
      { name: 'nonce', type: 'uint256' },
    ],
  };
}

export function generateSafeTypedData(args: SafeEIP712Args): EIP712TypedData {
  const { safeAddress, safeVersion, chainId, data } = args;
  const domain: TypedDataDomain = satisfies(safeVersion, EQ_OR_GT_1_3_0)
    ? { chainId, verifyingContract: safeAddress }
    : { verifyingContract: safeAddress };

  if (typeof data === 'string') {
    return {
      domain,
      types: { SafeMessage: [{ name: 'message', type: 'bytes' }] },
      primaryType: 'SafeMessage',
      message: { message: data },
    };
  }

  if ('types' in data && 'domain' in data && 'message' in data) {
    return { ...data, domain };
  }

  const txTypes = getEip712TxTypes(safeVersion);
  const types: TypedMessageTypes = {
    EIP712Domain: txTypes.EIP712Domain,
    SafeTx: txTypes.SafeTx as TypedDataParameter[],
  };

  return {
    domain,
    types,
    primaryType: 'SafeTx',
    message: {
      to: data.to,
      value: BigInt(data.value),
      data: data.data,
      operation: data.operation,
      safeTxGas: data.safeTxGas,
      baseGas: data.baseGas,
      gasPrice: data.gasPrice,
      gasToken: data.gasToken,
      refundReceiver: data.refundReceiver,
      nonce: data.nonce,
    },
  };
}

export function calculateSafeEIP712Hash(args: SafeEIP712Args): string {
  return hashTypedData(generateSafeTypedData(args));
}
