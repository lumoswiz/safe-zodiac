import './setup';
import { suite, DEPLOYED_SAFE_ADDRESS } from './setup';
import { unwrap } from '../test-utils';
import { account } from '../config';
import type { Address } from 'viem';
import { describe, it, expect } from 'bun:test';

describe('Owner Helpers', () => {
  it('getOwners includes the deployer', async () => {
    const owners = unwrap(await suite.getOwners(DEPLOYED_SAFE_ADDRESS));
    expect(owners).toContain(account.address);
  });

  it('isOwner true/false', async () => {
    expect(
      unwrap(await suite.isOwner(DEPLOYED_SAFE_ADDRESS, account.address))
    ).toBe(true);
    const notOwner: Address = '0xcafee5b8e78900e7130a9eef940fe898c610c0f9';
    expect(unwrap(await suite.isOwner(DEPLOYED_SAFE_ADDRESS, notOwner))).toBe(
      false
    );
  });
});
