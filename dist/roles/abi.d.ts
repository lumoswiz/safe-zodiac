export declare const ROLES_V2_MODULE_ABI: readonly [{
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_owner";
        readonly type: "address";
    }, {
        readonly internalType: "address";
        readonly name: "_avatar";
        readonly type: "address";
    }, {
        readonly internalType: "address";
        readonly name: "_target";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "constructor";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }];
    readonly name: "AlreadyDisabledModule";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }];
    readonly name: "AlreadyEnabledModule";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "ArraysDifferentLength";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "CalldataOutOfBounds";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "enum PermissionChecker.Status";
        readonly name: "status";
        readonly type: "uint8";
    }, {
        readonly internalType: "bytes32";
        readonly name: "info";
        readonly type: "bytes32";
    }];
    readonly name: "ConditionViolation";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "FunctionSignatureTooShort";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly name: "HashAlreadyConsumed";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "InvalidInitialization";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }];
    readonly name: "InvalidModule";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "InvalidPageSize";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "MalformedMultiEntrypoint";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "ModuleTransactionFailed";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "NoMembership";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "sender";
        readonly type: "address";
    }];
    readonly name: "NotAuthorized";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "NotInitializing";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "owner";
        readonly type: "address";
    }];
    readonly name: "OwnableInvalidOwner";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "account";
        readonly type: "address";
    }];
    readonly name: "OwnableUnauthorizedAccount";
    readonly type: "error";
}, {
    readonly inputs: readonly [];
    readonly name: "SetupModulesAlreadyCalled";
    readonly type: "error";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "targetAddress";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "bytes4";
        readonly name: "selector";
        readonly type: "bytes4";
    }, {
        readonly indexed: false;
        readonly internalType: "enum ExecutionOptions";
        readonly name: "options";
        readonly type: "uint8";
    }];
    readonly name: "AllowFunction";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "targetAddress";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "enum ExecutionOptions";
        readonly name: "options";
        readonly type: "uint8";
    }];
    readonly name: "AllowTarget";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "bytes32[]";
        readonly name: "roleKeys";
        readonly type: "bytes32[]";
    }, {
        readonly indexed: false;
        readonly internalType: "bool[]";
        readonly name: "memberOf";
        readonly type: "bool[]";
    }];
    readonly name: "AssignRoles";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "previousAvatar";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "newAvatar";
        readonly type: "address";
    }];
    readonly name: "AvatarSet";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "bytes32";
        readonly name: "allowanceKey";
        readonly type: "bytes32";
    }, {
        readonly indexed: false;
        readonly internalType: "uint128";
        readonly name: "consumed";
        readonly type: "uint128";
    }, {
        readonly indexed: false;
        readonly internalType: "uint128";
        readonly name: "newBalance";
        readonly type: "uint128";
    }];
    readonly name: "ConsumeAllowance";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }];
    readonly name: "DisabledModule";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }];
    readonly name: "EnabledModule";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }];
    readonly name: "ExecutionFromModuleFailure";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }];
    readonly name: "ExecutionFromModuleSuccess";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "bytes32";
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly name: "HashExecuted";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "bytes32";
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly name: "HashInvalidated";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "uint64";
        readonly name: "version";
        readonly type: "uint64";
    }];
    readonly name: "Initialized";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "previousOwner";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "newOwner";
        readonly type: "address";
    }];
    readonly name: "OwnershipTransferred";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "targetAddress";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "bytes4";
        readonly name: "selector";
        readonly type: "bytes4";
    }];
    readonly name: "RevokeFunction";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "targetAddress";
        readonly type: "address";
    }];
    readonly name: "RevokeTarget";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "initiator";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "avatar";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "target";
        readonly type: "address";
    }];
    readonly name: "RolesModSetup";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "targetAddress";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "bytes4";
        readonly name: "selector";
        readonly type: "bytes4";
    }, {
        readonly components: readonly [{
            readonly internalType: "uint8";
            readonly name: "parent";
            readonly type: "uint8";
        }, {
            readonly internalType: "enum ParameterType";
            readonly name: "paramType";
            readonly type: "uint8";
        }, {
            readonly internalType: "enum Operator";
            readonly name: "operator";
            readonly type: "uint8";
        }, {
            readonly internalType: "bytes";
            readonly name: "compValue";
            readonly type: "bytes";
        }];
        readonly indexed: false;
        readonly internalType: "struct ConditionFlat[]";
        readonly name: "conditions";
        readonly type: "tuple[]";
    }, {
        readonly indexed: false;
        readonly internalType: "enum ExecutionOptions";
        readonly name: "options";
        readonly type: "uint8";
    }];
    readonly name: "ScopeFunction";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "targetAddress";
        readonly type: "address";
    }];
    readonly name: "ScopeTarget";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "bytes32";
        readonly name: "allowanceKey";
        readonly type: "bytes32";
    }, {
        readonly indexed: false;
        readonly internalType: "uint128";
        readonly name: "balance";
        readonly type: "uint128";
    }, {
        readonly indexed: false;
        readonly internalType: "uint128";
        readonly name: "maxRefill";
        readonly type: "uint128";
    }, {
        readonly indexed: false;
        readonly internalType: "uint128";
        readonly name: "refill";
        readonly type: "uint128";
    }, {
        readonly indexed: false;
        readonly internalType: "uint64";
        readonly name: "period";
        readonly type: "uint64";
    }, {
        readonly indexed: false;
        readonly internalType: "uint64";
        readonly name: "timestamp";
        readonly type: "uint64";
    }];
    readonly name: "SetAllowance";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "bytes32";
        readonly name: "defaultRoleKey";
        readonly type: "bytes32";
    }];
    readonly name: "SetDefaultRole";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: false;
        readonly internalType: "address";
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly indexed: false;
        readonly internalType: "bytes4";
        readonly name: "selector";
        readonly type: "bytes4";
    }, {
        readonly indexed: false;
        readonly internalType: "contract ITransactionUnwrapper";
        readonly name: "adapter";
        readonly type: "address";
    }];
    readonly name: "SetUnwrapAdapter";
    readonly type: "event";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "previousTarget";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "newTarget";
        readonly type: "address";
    }];
    readonly name: "TargetSet";
    readonly type: "event";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly internalType: "address";
        readonly name: "targetAddress";
        readonly type: "address";
    }, {
        readonly internalType: "bytes4";
        readonly name: "selector";
        readonly type: "bytes4";
    }, {
        readonly internalType: "enum ExecutionOptions";
        readonly name: "options";
        readonly type: "uint8";
    }];
    readonly name: "allowFunction";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly internalType: "address";
        readonly name: "targetAddress";
        readonly type: "address";
    }, {
        readonly internalType: "enum ExecutionOptions";
        readonly name: "options";
        readonly type: "uint8";
    }];
    readonly name: "allowTarget";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly name: "allowances";
    readonly outputs: readonly [{
        readonly internalType: "uint128";
        readonly name: "refill";
        readonly type: "uint128";
    }, {
        readonly internalType: "uint128";
        readonly name: "maxRefill";
        readonly type: "uint128";
    }, {
        readonly internalType: "uint64";
        readonly name: "period";
        readonly type: "uint64";
    }, {
        readonly internalType: "uint128";
        readonly name: "balance";
        readonly type: "uint128";
    }, {
        readonly internalType: "uint64";
        readonly name: "timestamp";
        readonly type: "uint64";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }, {
        readonly internalType: "bytes32[]";
        readonly name: "roleKeys";
        readonly type: "bytes32[]";
    }, {
        readonly internalType: "bool[]";
        readonly name: "memberOf";
        readonly type: "bool[]";
    }];
    readonly name: "assignRoles";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "avatar";
    readonly outputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }, {
        readonly internalType: "bytes32";
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly name: "consumed";
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
        readonly name: "";
        readonly type: "address";
    }];
    readonly name: "defaultRoles";
    readonly outputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "";
        readonly type: "bytes32";
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
        readonly internalType: "enum Enum.Operation";
        readonly name: "operation";
        readonly type: "uint8";
    }];
    readonly name: "execTransactionFromModule";
    readonly outputs: readonly [{
        readonly internalType: "bool";
        readonly name: "success";
        readonly type: "bool";
    }];
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
    }];
    readonly name: "execTransactionFromModuleReturnData";
    readonly outputs: readonly [{
        readonly internalType: "bool";
        readonly name: "success";
        readonly type: "bool";
    }, {
        readonly internalType: "bytes";
        readonly name: "returnData";
        readonly type: "bytes";
    }];
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
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly internalType: "bool";
        readonly name: "shouldRevert";
        readonly type: "bool";
    }];
    readonly name: "execTransactionWithRole";
    readonly outputs: readonly [{
        readonly internalType: "bool";
        readonly name: "success";
        readonly type: "bool";
    }];
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
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly internalType: "bool";
        readonly name: "shouldRevert";
        readonly type: "bool";
    }];
    readonly name: "execTransactionWithRoleReturnData";
    readonly outputs: readonly [{
        readonly internalType: "bool";
        readonly name: "success";
        readonly type: "bool";
    }, {
        readonly internalType: "bytes";
        readonly name: "returnData";
        readonly type: "bytes";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "start";
        readonly type: "address";
    }, {
        readonly internalType: "uint256";
        readonly name: "pageSize";
        readonly type: "uint256";
    }];
    readonly name: "getModulesPaginated";
    readonly outputs: readonly [{
        readonly internalType: "address[]";
        readonly name: "array";
        readonly type: "address[]";
    }, {
        readonly internalType: "address";
        readonly name: "next";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "hash";
        readonly type: "bytes32";
    }];
    readonly name: "invalidate";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_module";
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
    readonly inputs: readonly [{
        readonly internalType: "bytes";
        readonly name: "data";
        readonly type: "bytes";
    }, {
        readonly internalType: "bytes32";
        readonly name: "salt";
        readonly type: "bytes32";
    }];
    readonly name: "moduleTxHash";
    readonly outputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "owner";
    readonly outputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "renounceOwnership";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly internalType: "address";
        readonly name: "targetAddress";
        readonly type: "address";
    }, {
        readonly internalType: "bytes4";
        readonly name: "selector";
        readonly type: "bytes4";
    }];
    readonly name: "revokeFunction";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly internalType: "address";
        readonly name: "targetAddress";
        readonly type: "address";
    }];
    readonly name: "revokeTarget";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly internalType: "address";
        readonly name: "targetAddress";
        readonly type: "address";
    }, {
        readonly internalType: "bytes4";
        readonly name: "selector";
        readonly type: "bytes4";
    }, {
        readonly components: readonly [{
            readonly internalType: "uint8";
            readonly name: "parent";
            readonly type: "uint8";
        }, {
            readonly internalType: "enum ParameterType";
            readonly name: "paramType";
            readonly type: "uint8";
        }, {
            readonly internalType: "enum Operator";
            readonly name: "operator";
            readonly type: "uint8";
        }, {
            readonly internalType: "bytes";
            readonly name: "compValue";
            readonly type: "bytes";
        }];
        readonly internalType: "struct ConditionFlat[]";
        readonly name: "conditions";
        readonly type: "tuple[]";
    }, {
        readonly internalType: "enum ExecutionOptions";
        readonly name: "options";
        readonly type: "uint8";
    }];
    readonly name: "scopeFunction";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }, {
        readonly internalType: "address";
        readonly name: "targetAddress";
        readonly type: "address";
    }];
    readonly name: "scopeTarget";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "key";
        readonly type: "bytes32";
    }, {
        readonly internalType: "uint128";
        readonly name: "balance";
        readonly type: "uint128";
    }, {
        readonly internalType: "uint128";
        readonly name: "maxRefill";
        readonly type: "uint128";
    }, {
        readonly internalType: "uint128";
        readonly name: "refill";
        readonly type: "uint128";
    }, {
        readonly internalType: "uint64";
        readonly name: "period";
        readonly type: "uint64";
    }, {
        readonly internalType: "uint64";
        readonly name: "timestamp";
        readonly type: "uint64";
    }];
    readonly name: "setAllowance";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_avatar";
        readonly type: "address";
    }];
    readonly name: "setAvatar";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "module";
        readonly type: "address";
    }, {
        readonly internalType: "bytes32";
        readonly name: "roleKey";
        readonly type: "bytes32";
    }];
    readonly name: "setDefaultRole";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "_target";
        readonly type: "address";
    }];
    readonly name: "setTarget";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "to";
        readonly type: "address";
    }, {
        readonly internalType: "bytes4";
        readonly name: "selector";
        readonly type: "bytes4";
    }, {
        readonly internalType: "contract ITransactionUnwrapper";
        readonly name: "adapter";
        readonly type: "address";
    }];
    readonly name: "setTransactionUnwrapper";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes";
        readonly name: "initParams";
        readonly type: "bytes";
    }];
    readonly name: "setUp";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [];
    readonly name: "target";
    readonly outputs: readonly [{
        readonly internalType: "address";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "newOwner";
        readonly type: "address";
    }];
    readonly name: "transferOwnership";
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}, {
    readonly inputs: readonly [{
        readonly internalType: "bytes32";
        readonly name: "";
        readonly type: "bytes32";
    }];
    readonly name: "unwrappers";
    readonly outputs: readonly [{
        readonly internalType: "contract ITransactionUnwrapper";
        readonly name: "";
        readonly type: "address";
    }];
    readonly stateMutability: "view";
    readonly type: "function";
}];
export declare const MODULE_PROXY_FACTORY_ABI: readonly [{
    readonly inputs: readonly [];
    readonly name: "FailedInitialization";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "address_";
        readonly type: "address";
    }];
    readonly name: "TakenAddress";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "target";
        readonly type: "address";
    }];
    readonly name: "TargetHasNoCode";
    readonly type: "error";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "target";
        readonly type: "address";
    }];
    readonly name: "ZeroAddress";
    readonly type: "error";
}, {
    readonly anonymous: false;
    readonly inputs: readonly [{
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "proxy";
        readonly type: "address";
    }, {
        readonly indexed: true;
        readonly internalType: "address";
        readonly name: "masterCopy";
        readonly type: "address";
    }];
    readonly name: "ModuleProxyCreation";
    readonly type: "event";
}, {
    readonly inputs: readonly [{
        readonly internalType: "address";
        readonly name: "masterCopy";
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
    readonly name: "deployModule";
    readonly outputs: readonly [{
        readonly internalType: "address";
        readonly name: "proxy";
        readonly type: "address";
    }];
    readonly stateMutability: "nonpayable";
    readonly type: "function";
}];
//# sourceMappingURL=abi.d.ts.map