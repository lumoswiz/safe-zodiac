import { Hex } from 'viem';

import { ExecutionOptions } from './index';

export enum Clearance {
  None = 0,
  Target = 1,
  Function = 2,
}

type ClearanceKey = keyof typeof Clearance;
export type ExecKey = keyof typeof ExecutionOptions;

export interface Annotation {
  uri: string;
  schema: string;
}

interface SubgraphCondition {
  id: string;
  payload: unknown;
}

export interface Func {
  selector: Hex;
  executionOptions: ExecutionOptions;
  wildcarded: boolean;
  condition: SubgraphCondition | null;
}

export interface MemberAssignment {
  address: Hex;
}

export interface SubgraphRole {
  key: Hex;
  members: MemberAssignment[];
  targets: Target[];
  annotations: Annotation[];
  lastUpdate: number;
}

export interface Target {
  address: Hex;
  clearance: Clearance;
  executionOptions: ExecutionOptions;
  functions: Func[];
}

interface RawFunction {
  selector: Hex;
  executionOptions: ExecKey;
  wildcarded: boolean;
  condition: { id: string; json: string } | null;
}

interface RawMember {
  member: { address: Hex };
}

interface RawTarget {
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
