import { Hex } from 'viem';
import { ExecutionOptions } from './roles';

export interface SubgraphRole {
  key: Hex;
  members: MemberAssignment[];
  targets: Target[];
  annotations: Annotation[];
  lastUpdate: number;
}

export interface MemberAssignment {
  address: Hex;
}

export interface Target {
  address: Hex;
  clearance: Clearance;
  executionOptions: ExecutionOptions;
  functions: Func[];
}

export interface Func {
  selector: Hex;
  executionOptions: ExecutionOptions;
  wildcarded: boolean;
  condition: Condition | null;
}

export interface Condition {
  id: string;
  payload: unknown;
}

export interface Annotation {
  uri: string;
  schema: string;
}

export enum Clearance {
  None = 0,
  Target = 1,
  Function = 2,
}

export type ClearanceKey = keyof typeof Clearance;
export type ExecKey = keyof typeof ExecutionOptions;

export interface RawMember {
  member: { address: Hex };
}

export interface RawFunction {
  selector: Hex;
  executionOptions: ExecKey;
  wildcarded: boolean;
  condition: { id: string; json: string } | null;
}

export interface RawTarget {
  address: Hex;
  clearance: ClearanceKey;
  executionOptions: ExecKey;
  functions: RawFunction[];
}

export interface RawSubgraphRole {
  key: Hex;
  members: RawMember[];
  targets: RawTarget[];
  annotations: Annotation[];
  lastUpdate: number;
}
