import { Address, Hex } from 'viem';
import { CHAINS } from '../shared/constants';
import {
  Clearance,
  ExecutionOptions,
  RawSubgraphRole,
  SubgraphRole,
} from '@sdk/types';

const SUBGRAPH_URL =
  'https://gnosisguild.squids.live/roles:production/api/graphql';

const ROLE_QUERY = `
  query Role($id: ID!) {
    role(id: $id) {
      key
      members {
        member {
          address
        }
      }
      targets {
        address
        clearance
        executionOptions
        functions {
          selector
          executionOptions
          wildcarded
          condition {
            id
            json
          }
        }
      }
      annotations {
        uri
        schema
      }
      lastUpdate
    }
  }
`.trim();

type FetchOptions = Omit<RequestInit, 'method' | 'body'>;

interface QueryRequest {
  query: string;
  variables: Record<string, string | number | undefined>;
  operationName: string;
}

async function fetchFromSubgraph<T = unknown>(
  request: QueryRequest,
  options?: FetchOptions
): Promise<T> {
  const res = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    body: JSON.stringify(request),
    ...options,
  });

  const json = await res.json();

  const error = json.error || (Array.isArray(json.errors) && json.errors[0]);
  if (error) {
    const message =
      typeof error === 'object'
        ? error.message || 'Unknown subgraph error'
        : String(error);
    throw new Error(`Subgraph error: ${message}`);
  }

  if (!json.data) {
    throw new Error('Subgraph returned no data');
  }

  return json.data as T;
}

function getRoleIdForSubgraph(
  chainId: number,
  moduleAddress: string,
  roleKey: string
): string {
  const chain = CHAINS[chainId];
  if (!chain) throw new Error(`Unsupported chain ID for subgraph: ${chainId}`);
  return `${chain.prefix}:${moduleAddress.toLowerCase()}:${roleKey}`;
}

function mapGraphQlRole(raw: RawSubgraphRole): SubgraphRole {
  const parseClearance = (s: string): Clearance =>
    Clearance[s as keyof typeof Clearance];

  const parseExecOpt = (s: string): ExecutionOptions => {
    if (!(s in ExecutionOptions)) {
      throw new Error(`Unknown executionOptions value “${s}”`);
    }
    return ExecutionOptions[s as keyof typeof ExecutionOptions];
  };

  return {
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
  };
}

export async function fetchRoleFromSubgraph(
  chainId: number,
  moduleAddress: Address,
  roleKey: Hex
): Promise<SubgraphRole | null> {
  const id = getRoleIdForSubgraph(chainId, moduleAddress, roleKey);

  const res = await fetchFromSubgraph<{ role: RawSubgraphRole | null }>({
    query: ROLE_QUERY,
    variables: { id },
    operationName: 'Role',
  });

  if (!res.role) return null;

  return mapGraphQlRole(res.role);
}
