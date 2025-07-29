import { type PublicClient, type Address, Hex } from 'viem';
import { BuildTxResult, MetaTransactionData, OperationType, Result } from '../types';
export declare function isContractDeployed(client: PublicClient, address: Address): Promise<boolean>;
export declare function toMetaTx(tx: {
    to: Address;
    data: Hex;
    operation?: OperationType;
}): MetaTransactionData;
export declare function unwrapOrFail<R, E>(res: Result<R, E>): R | (E & {
    _isError: true;
});
export declare const maybeError: <T>(val: T | {
    _isError: true;
}) => val is {
    _isError: true;
};
export declare function makeOk<T, E = unknown>(value: T): Result<T, E>;
export declare function makeError<T>(error: unknown): Result<T, unknown>;
export declare function matchResult<T extends {
    status: 'ok';
    value: any;
} | {
    status: 'error';
    error: any;
}, R>(result: T, handlers: {
    ok: (value: Extract<T, {
        status: 'ok';
    }>) => R | Promise<R>;
    error: (error: Extract<T, {
        status: 'error';
    }>) => R | Promise<R>;
}): Promise<R>;
export declare function mapResult<T, U, E>(res: Result<T, E>, fn: (value: T) => U): Result<U, E>;
export declare function flatMapResult<T, E, U>(promise: Promise<Result<T, E>>, fn: (value: T) => Result<U, E> | Promise<Result<U, E>>): Promise<Result<U, E>>;
export declare function expectBuiltTx(result: Promise<BuildTxResult>, context: string): Promise<MetaTransactionData>;
export declare function maybeBuiltTx(result: Promise<BuildTxResult>): Promise<MetaTransactionData | null>;
//# sourceMappingURL=utils.d.ts.map