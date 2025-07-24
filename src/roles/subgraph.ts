import { Address, Hex } from 'viem';
import {
  Clearance,
  ExecutionOptions,
  FetchRoleResult,
  RawSubgraphRole,
  SubgraphRole,
} from '../types';
import { CHAINS } from '../shared/constants';

export type FetchOptions = Omit<RequestInit, 'method' | 'body'>;

interface QueryRequest {
  query: string;
  variables: Record<string, string | number | undefined>;
  operationName: string;
}

const SQD_URL = 'https://gnosisguild.squids.live/roles:production/api/graphql';

export const fetchFromSubgraph = async <T = unknown>(
  request: QueryRequest,
  options?: FetchOptions
): Promise<T> => {
  const res = await fetch(SQD_URL, {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(request),
  });

  const { data, error, errors } = await res.json();
  const firstError = error || (errors && errors[0]);
  if (firstError) {
    const msg =
      typeof firstError === 'object'
        ? firstError.message || 'Unknown error'
        : firstError;
    throw new Error(msg);
  }
  if (!data) throw new Error('Query returned no data');
  return data as T;
};

function parseClearance(s: string): Clearance {
  return Clearance[s as keyof typeof Clearance];
}

function parseExecOpt(s: string): ExecutionOptions {
  if (!(s in ExecutionOptions)) {
    throw new Error(`Unknown executionOptions value “${s}”`);
  }
  return ExecutionOptions[s as keyof typeof ExecutionOptions];
}

export const mapGraphQlRole = (raw: RawSubgraphRole): SubgraphRole => ({
  key: raw.key,
  members: raw.members.map((m) => m.member),
  targets: raw.targets.map((t) => ({
    address: t.address,
    clearance: parseClearance(t.clearance),
    executionOptions: parseExecOpt(t.executionOptions),
    functions: t.functions.map((f) => ({
      selector: f.selector,
      executionOptions: parseExecOpt(f.executionOptions),
      wildcarded: f.wildcarded,
      condition: f.condition
        ? { id: f.condition.id, payload: JSON.parse(f.condition.json) }
        : null,
    })),
  })),
  annotations: raw.annotations,
  lastUpdate: raw.lastUpdate,
});

const ROLE_QUERY = `
query Role($id: ID!) {
  role(id: $id) {
    key
    members { member { address } }
    targets {
      address
      clearance
      executionOptions
      functions {
        selector
        executionOptions
        wildcarded
        condition { id json }
      }
    }
    annotations { uri schema }
    lastUpdate
  }
}
`.trim();

export function getRoleId(
  chainId: number,
  address: Address,
  roleKey: Hex
): Hex {
  const chain = CHAINS[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return `${chain.prefix}:${address.toLowerCase()}:${roleKey}` as Hex;
}

export const fetchRole = async (
  chainId: number,
  address: Address,
  roleKey: Hex,
  options?: FetchOptions
): Promise<FetchRoleResult> => {
  try {
    const id = getRoleId(chainId, address, roleKey);

    const { role } = await fetchFromSubgraph<{ role: SubgraphRole | null }>(
      {
        query: ROLE_QUERY,
        variables: { id },
        operationName: 'Role',
      },
      options
    );
    return { status: 'ok', value: role };
  } catch (error) {
    return { status: 'error', error };
  }
};
