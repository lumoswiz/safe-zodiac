import { Address, Hex } from 'viem';
export declare enum ExecutionOptions {
    None = 0,
    Send = 1,
    DelegateCall = 2,
    Both = 3
}
export declare enum Operator {
    Pass = 0,
    And = 1,
    Or = 2,
    Nor = 3,
    _Placeholder04 = 4,
    Matches = 5,
    ArraySome = 6,
    ArrayEvery = 7,
    ArraySubset = 8,
    _Placeholder09 = 9,
    _Placeholder10 = 10,
    _Placeholder11 = 11,
    _Placeholder12 = 12,
    _Placeholder13 = 13,
    _Placeholder14 = 14,
    EqualToAvatar = 15,
    EqualTo = 16,
    GreaterThan = 17,
    LessThan = 18,
    SignedIntGreaterThan = 19,
    SignedIntLessThan = 20,
    Bitmask = 21,
    Custom = 22,
    _Placeholder23 = 23,
    _Placeholder24 = 24,
    _Placeholder25 = 25,
    _Placeholder26 = 26,
    _Placeholder27 = 27,
    WithinAllowance = 28,
    EtherWithinAllowance = 29,
    CallWithinAllowance = 30,
    _Placeholder31 = 31
}
export declare enum ParameterType {
    None = 0,
    Static = 1,
    Dynamic = 2,
    Tuple = 3,
    Array = 4,
    Calldata = 5,
    AbiEncoded = 6
}
export interface ConditionFlat {
    parent: number;
    paramType: ParameterType;
    operator: Operator;
    compValue: Hex;
}
export interface Condition {
    paramType: ParameterType;
    operator: Operator;
    compValue?: `0x${string}`;
    children?: readonly Condition[];
}
export interface RoleScope {
    selectors: Hex;
    conditions: ConditionFlat[];
    execOpts?: ExecutionOptions;
}
export interface RolesSetupArgs {
    member: Address;
    roleKey: Hex;
    target: Address;
    scopes: RoleScope[];
}
export type PartialRolesSetupArgs = Partial<RolesSetupArgs>;
//# sourceMappingURL=roles.d.ts.map