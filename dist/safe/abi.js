export const SAFE_SINGLETON_ABI = [
    {
        inputs: [
            { internalType: 'address[]', name: '_owners', type: 'address[]' },
            { internalType: 'uint256', name: '_threshold', type: 'uint256' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'bytes', name: 'data', type: 'bytes' },
            { internalType: 'address', name: 'fallbackHandler', type: 'address' },
            { internalType: 'address', name: 'paymentToken', type: 'address' },
            { internalType: 'uint256', name: 'payment', type: 'uint256' },
            { internalType: 'address', name: 'paymentReceiver', type: 'address' },
        ],
        name: 'setup',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'owner', type: 'address' },
            { internalType: 'uint256', name: '_threshold', type: 'uint256' },
        ],
        name: 'addOwnerWithThreshold',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'prevOwner', type: 'address' },
            { internalType: 'address', name: 'owner', type: 'address' },
            { internalType: 'uint256', name: '_threshold', type: 'uint256' },
        ],
        name: 'removeOwner',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
export const SAFE_PROXY_FACTORY_ABI = [
    {
        inputs: [],
        name: 'proxyCreationCode',
        outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_singleton', type: 'address' },
            { internalType: 'bytes', name: 'initializer', type: 'bytes' },
            { internalType: 'uint256', name: 'saltNonce', type: 'uint256' },
        ],
        name: 'createProxyWithNonce',
        outputs: [
            { internalType: 'contract SafeProxy', name: 'proxy', type: 'address' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
export const SAFE_PROXY_ABI = [
    {
        inputs: [],
        name: 'getOwners',
        outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getThreshold',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'module', type: 'address' }],
        name: 'isModuleEnabled',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'nonce',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'module', type: 'address' }],
        name: 'enableModule',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'value', type: 'uint256' },
            { internalType: 'bytes', name: 'data', type: 'bytes' },
            { internalType: 'uint8', name: 'operation', type: 'uint8' },
            { internalType: 'uint256', name: 'safeTxGas', type: 'uint256' },
            { internalType: 'uint256', name: 'baseGas', type: 'uint256' },
            { internalType: 'uint256', name: 'gasPrice', type: 'uint256' },
            { internalType: 'address', name: 'gasToken', type: 'address' },
            { internalType: 'address', name: 'refundReceiver', type: 'address' },
            { internalType: 'bytes', name: 'signatures', type: 'bytes' },
        ],
        name: 'execTransaction',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address[]', name: '_owners', type: 'address[]' },
            { internalType: 'uint256', name: '_threshold', type: 'uint256' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'bytes', name: 'data', type: 'bytes' },
            { internalType: 'address', name: 'fallbackHandler', type: 'address' },
            { internalType: 'address', name: 'paymentToken', type: 'address' },
            { internalType: 'uint256', name: 'payment', type: 'uint256' },
            { internalType: 'address', name: 'paymentReceiver', type: 'address' },
        ],
        name: 'setup',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'VERSION',
        outputs: [
            {
                internalType: 'string',
                name: '',
                type: 'string',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
        ],
        name: 'isOwner',
        outputs: [
            {
                internalType: 'bool',
                name: '',
                type: 'bool',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'prevModule',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'module',
                type: 'address',
            },
        ],
        name: 'disableModule',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
            },
            {
                internalType: 'bytes',
                name: 'data',
                type: 'bytes',
            },
            {
                internalType: 'enum Enum.Operation',
                name: 'operation',
                type: 'uint8',
            },
            {
                internalType: 'uint256',
                name: 'safeTxGas',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'baseGas',
                type: 'uint256',
            },
            {
                internalType: 'uint256',
                name: 'gasPrice',
                type: 'uint256',
            },
            {
                internalType: 'address',
                name: 'gasToken',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'refundReceiver',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_nonce',
                type: 'uint256',
            },
        ],
        name: 'getTransactionHash',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'bytes32',
                name: 'dataHash',
                type: 'bytes32',
            },
            {
                internalType: 'bytes',
                name: 'data',
                type: 'bytes',
            },
            {
                internalType: 'bytes',
                name: 'signatures',
                type: 'bytes',
            },
            {
                internalType: 'uint256',
                name: 'requiredSignatures',
                type: 'uint256',
            },
        ],
        name: 'checkNSignatures',
        outputs: [],
        stateMutability: 'view',
        type: 'function',
    },
];
