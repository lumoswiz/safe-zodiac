import { CHAINS } from '../shared/constants';
import { Clearance, ExecutionOptions, } from '@sdk/types';
const SUBGRAPH_URL = 'https://gnosisguild.squids.live/roles:production/api/graphql';
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
async function fetchFromSubgraph(request, options) {
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
        const message = typeof error === 'object'
            ? error.message || 'Unknown subgraph error'
            : String(error);
        throw new Error(`Subgraph error: ${message}`);
    }
    if (!json.data) {
        throw new Error('Subgraph returned no data');
    }
    return json.data;
}
function getRoleIdForSubgraph(chainId, moduleAddress, roleKey) {
    const chain = CHAINS[chainId];
    if (!chain)
        throw new Error(`Unsupported chain ID for subgraph: ${chainId}`);
    return `${chain.prefix}:${moduleAddress.toLowerCase()}:${roleKey}`;
}
function mapGraphQlRole(raw) {
    const parseClearance = (s) => Clearance[s];
    const parseExecOpt = (s) => {
        if (!(s in ExecutionOptions)) {
            throw new Error(`Unknown executionOptions value “${s}”`);
        }
        return ExecutionOptions[s];
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
export async function fetchRoleFromSubgraph(chainId, moduleAddress, roleKey) {
    const id = getRoleIdForSubgraph(chainId, moduleAddress, roleKey);
    const res = await fetchFromSubgraph({
        query: ROLE_QUERY,
        variables: { id },
        operationName: 'Role',
    });
    if (!res.role)
        return null;
    return mapGraphQlRole(res.role);
}
