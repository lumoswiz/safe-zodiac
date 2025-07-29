import { OperationType, } from '../types';
export async function isContractDeployed(client, address) {
    const code = await client.getCode({ address });
    return !!(code && code !== '0x');
}
export function toMetaTx(tx) {
    return {
        to: tx.to,
        data: tx.data,
        value: '0x00',
        operation: tx.operation ?? OperationType.Call,
    };
}
export function unwrapOrFail(res) {
    if (res.status === 'ok')
        return res.value;
    return { ...res.error, _isError: true };
}
export const maybeError = (val) => !!val && typeof val === 'object' && '_isError' in val;
export function makeOk(value) {
    return { status: 'ok', value };
}
export function makeError(error) {
    return { status: 'error', error };
}
export async function matchResult(result, handlers) {
    if (result.status === 'ok') {
        return handlers.ok(result);
    }
    else {
        return handlers.error(result);
    }
}
export function mapResult(res, fn) {
    return res.status === 'ok' ? makeOk(fn(res.value)) : res;
}
export async function flatMapResult(promise, fn) {
    const res = await promise;
    if (res.status === 'error')
        return res;
    return fn(res.value);
}
export async function expectBuiltTx(result, context) {
    const res = await result;
    return matchResult(res, {
        ok: ({ value }) => {
            if (value.kind === 'skipped') {
                throw new Error(`${context} unexpectedly skipped.`);
            }
            return value.tx;
        },
        error: ({ error }) => Promise.reject(error),
    });
}
export async function maybeBuiltTx(result) {
    const res = await result;
    return matchResult(res, {
        ok: ({ value }) => (value.kind === 'built' ? value.tx : null),
        error: ({ error }) => Promise.reject(error),
    });
}
