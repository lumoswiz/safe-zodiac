import { satisfies } from 'semver';
import { hashMessage, hashTypedData, isHex, fromHex, Hash } from 'viem';
import type { EIP712TypedData, MinimalSafeInfo } from '../types';

const EQ_OR_GT_1_3_0 = '>=1.3.0';

export type DecodedSafeMessage = {
  decodedMessage: string | EIP712TypedData;
  safeMessageMessage: string;
  safeMessageHash: Hash;
};

const generateSafeMessageMessage = (
  message: string | EIP712TypedData
): string => {
  return typeof message === 'string'
    ? hashMessage(message)
    : hashTypedData(message);
};

const generateSafeMessageTypedData = (
  { version, chainId, address }: MinimalSafeInfo,
  message: string | EIP712TypedData
): EIP712TypedData => {
  if (!version) {
    throw Error('Cannot create SafeMessage without version information');
  }

  const domain = satisfies(version, EQ_OR_GT_1_3_0)
    ? {
        chainId: Number(BigInt(chainId)),
        address,
      }
    : { address };

  return {
    domain,
    types: { SafeMessage: [{ name: 'message', type: 'bytes' }] },
    message: { message: generateSafeMessageMessage(message) },
    primaryType: 'SafeMessage',
  };
};

const generateSafeMessageHash = (
  safe: MinimalSafeInfo,
  message: string | EIP712TypedData
): Hash => {
  const typedData = generateSafeMessageTypedData(safe, message);
  return hashTypedData(typedData);
};

const getDecodedMessage = (message: string): string => {
  if (isHex(message)) {
    try {
      return fromHex(message, 'string');
    } catch {}
  }
  return message;
};

export function decodeSafeMessage(
  message: string | EIP712TypedData,
  safe: MinimalSafeInfo
): DecodedSafeMessage {
  const decodedMessage =
    typeof message === 'string' ? getDecodedMessage(message) : message;

  return {
    decodedMessage,
    safeMessageMessage: generateSafeMessageMessage(decodedMessage),
    safeMessageHash: generateSafeMessageHash(safe, decodedMessage),
  };
}
