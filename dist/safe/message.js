import { satisfies } from 'semver';
import { hashMessage, hashTypedData, isHex, fromHex } from 'viem';
const EQ_OR_GT_1_3_0 = '>=1.3.0';
const generateSafeMessageMessage = (message) => {
    return typeof message === 'string'
        ? hashMessage(message)
        : hashTypedData(message);
};
const generateSafeMessageTypedData = ({ version, chainId, address }, message) => {
    if (!version) {
        throw Error('Cannot create SafeMessage without version information');
    }
    const domain = satisfies(version, EQ_OR_GT_1_3_0)
        ? { chainId: Number(chainId), verifyingContract: address }
        : { verifyingContract: address };
    return {
        domain,
        types: { SafeMessage: [{ name: 'message', type: 'bytes' }] },
        message: { message: generateSafeMessageMessage(message) },
        primaryType: 'SafeMessage',
    };
};
const generateSafeMessageHash = (safe, message) => {
    const typedData = generateSafeMessageTypedData(safe, message);
    return hashTypedData(typedData);
};
const getDecodedMessage = (message) => {
    if (isHex(message)) {
        try {
            return fromHex(message, 'string');
        }
        catch { }
    }
    return message;
};
export function decodeSafeMessage(message, safe) {
    try {
        const decodedMessage = typeof message === 'string' ? getDecodedMessage(message) : message;
        const safeMessageMessage = generateSafeMessageMessage(decodedMessage);
        const safeMessageHash = generateSafeMessageHash(safe, decodedMessage);
        return {
            status: 'ok',
            value: { decodedMessage, safeMessageMessage, safeMessageHash },
        };
    }
    catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        return { status: 'error', error: err };
    }
}
