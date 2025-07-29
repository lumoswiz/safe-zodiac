export declare const SAFE_SINGLETON_ABI: readonly [{
    readonly inputs: readonly [{
        readonly internalType: "address[]";
        readonly name: "_owners";
        readonly type: "address[]";
    }, {
        readonly internalType: "uint256";
        readonly name: "_threshold";
        readonly type: "uint256";
    }, {
        readonly internalType: "address";
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly internalType: "bytes";
        readonly name: "data";
        readonly type: "bytes";
    }, {
        readonly internalType: "address";
        readonly name: "fallbackHandler";
        readonly type: "address";
    }, {
        readonly internalType: "address";
        readonly name: "paymentToken";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "payment";
        readonly type: "uint256";
    }, {
        readonly internalType: "address";
        readonly name: "paymentReceiver";
        readonly type: "address";
    }];
    readonly name: "setup";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "_threshold";
        readonly type: "uint256";
    }];
    readonly name: "addOwnerWithThreshold";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "prevOwner";
        readonly type: "address";
    }, {
        readonly internalType: "address";
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "_threshold";
        readonly type: "uint256";
    }];
    readonly name: "removeOwner";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}];
export declare const SAFE_PROXY_FACTORY_ABI: readonly [{
    readonly inputs: readonly [];
    readonly name: "proxyCreationCode";
    readonly outputs: readonly [{
        readonly internalType: "bytes";
        readonly name: "";
        readonly type: "bytes";
    }];
    readonly stateMutability: "pure";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_singleton";
        readonly type: "address";
    }, {
        readonly internalType: "bytes";
        readonly name: "initializer";
        readonly type: "bytes";
    }, {
        readonly internalType: "uint256";
        readonly name: "saltNonce";
        readonly type: "uint256";
    }];
    readonly name: "createProxyWithNonce";
    readonly outputs: readonly [{
        readonly internalType: "contract SafeProxy";
        readonly name: "proxy";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}];
export declare const SAFE_PROXY_ABI: readonly [{
    readonly inputs: readonly [];
    readonly name: "getOwners";
    readonly outputs: readonly [{
        readonly internalType: "address[]";
        readonly name: "";
        readonly type: "address[]";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "getThreshold";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }];
    readonly name: "isModuleEnabled";
    readonly outputs: readonly [{
        readonly internalType: "bool";
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "nonce";
    readonly outputs: readonly [{
        readonly internalType: "uint256";
        readonly name: "";
        readonly type: "uint256";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }];
    readonly name: "enableModule";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "value";
        readonly type: "uint256";
    }, {
        readonly internalType: "bytes";
        readonly name: "data";
        readonly type: "bytes";
    }, {
        readonly internalType: "uint8";
        readonly name: "operation";
        readonly type: "uint8";
    }, {
        readonly internalType: "uint256";
        readonly name: "safeTxGas";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "baseGas";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "gasPrice";
        readonly type: "uint256";
    }, {
        readonly internalType: "address";
        readonly name: "gasToken";
        readonly type: "address";
    }, {
        readonly internalType: "address";
        readonly name: "refundReceiver";
        readonly type: "address";
    }, {
        readonly internalType: "bytes";
        readonly name: "signatures";
        readonly type: "bytes";
    }];
    readonly name: "execTransaction";
    readonly outputs: readonly [{
        readonly internalType: "bool";
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "payable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address[]";
        readonly name: "_owners";
        readonly type: "address[]";
    }, {
        readonly internalType: "uint256";
        readonly name: "_threshold";
        readonly type: "uint256";
    }, {
        readonly internalType: "address";
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly internalType: "bytes";
        readonly name: "data";
        readonly type: "bytes";
    }, {
        readonly internalType: "address";
        readonly name: "fallbackHandler";
        readonly type: "address";
    }, {
        readonly internalType: "address";
        readonly name: "paymentToken";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "payment";
        readonly type: "uint256";
    }, {
        readonly internalType: "address";
        readonly name: "paymentReceiver";
        readonly type: "address";
    }];
    readonly name: "setup";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "VERSION";
    readonly outputs: readonly [{
        readonly internalType: "string";
        readonly name: "";
        readonly type: "string";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "owner";
        readonly type: "address";
    }];
    readonly name: "isOwner";
    readonly outputs: readonly [{
        readonly internalType: "bool";
        readonly name: "";
        readonly type: "bool";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "prevModule";
        readonly type: "address";
    }, {
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }];
    readonly name: "disableModule";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "value";
        readonly type: "uint256";
    }, {
        readonly internalType: "bytes";
        readonly name: "data";
        readonly type: "bytes";
    }, {
        readonly internalType: "enum Enum.Operation";
        readonly name: "operation";
        readonly type: "uint8";
    }, {
        readonly internalType: "uint256";
        readonly name: "safeTxGas";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "baseGas";
        readonly type: "uint256";
    }, {
        readonly internalType: "uint256";
        readonly name: "gasPrice";
        readonly type: "uint256";
    }, {
        readonly internalType: "address";
        readonly name: "gasToken";
        readonly type: "address";
    }, {
        readonly internalType: "address";
        readonly name: "refundReceiver";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "_nonce";
        readonly type: "uint256";
    }];
    readonly name: "getTransactionHash";
    readonly outputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "dataHash";
        readonly type: "bytes32";
    }, {
        readonly internalType: "bytes";
        readonly name: "data";
        readonly type: "bytes";
    }, {
        readonly internalType: "bytes";
        readonly name: "signatures";
        readonly type: "bytes";
    }, {
        readonly internalType: "uint256";
        readonly name: "requiredSignatures";
        readonly type: "uint256";
    }];
    readonly name: "checkNSignatures";
    readonly outputs: readonly [];
    readonly stateMutability: "view";
    readonly type: "function";
}];
//# sourceMappingURL=abi.d.ts.map