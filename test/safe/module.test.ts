import '../setup';
import { testConfig } from '../config';
import { beforeEach, describe, expect, test } from 'bun:test';
import { SafeContractSuite } from '../../src/lib/safe';
import { account, DUMMY_MODULE, SENTINEL_ADDRESS } from '../src/constants';
import { signAndExec, expectOk, deploySafe } from '../utils';
import { Address, createPublicClient, http, PublicClient } from 'viem';
import { foundry } from 'viem/chains';

describe('Safe Modules', () => {
  let suite: SafeContractSuite;
  let publicClient: PublicClient;
  let DEPLOYED_SAFE_ADDRESS: Address;

  beforeEach(async () => {
    publicClient = createPublicClient({
      chain: foundry,
      transport: http(testConfig.rpcUrl),
    });
    suite = new SafeContractSuite(publicClient);

    ({ safeAddress: DEPLOYED_SAFE_ADDRESS, suite } = await deploySafe(
      publicClient
    ));
  });

  test('module is disabled by default', async () => {
    const isEnabled = expectOk(
      await suite.isModuleEnabled(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE),
      'Expected module to be disabled by default'
    );
    expect(isEnabled).toBe(false);
  });

  test('enableModule tx flips isModuleEnabled to true', async () => {
    const enableRes = await suite.buildEnableModuleTx(
      DEPLOYED_SAFE_ADDRESS,
      DUMMY_MODULE
    );

    if (enableRes.status === 'error') {
      throw new Error(
        `Could not build enableModule tx: ${String(enableRes.error)}`
      );
    }

    await signAndExec(
      suite,
      DEPLOYED_SAFE_ADDRESS,
      enableRes.value.txData,
      account
    );

    const isEnabled = expectOk(
      await suite.isModuleEnabled(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE),
      'Module should be enabled after enableModule tx'
    );
    expect(isEnabled).toBe(true);
  });

  test('disableModule tx flips isModuleEnabled to false', async () => {
    // Enable first
    const enableRes = await suite.buildEnableModuleTx(
      DEPLOYED_SAFE_ADDRESS,
      DUMMY_MODULE
    );

    if (enableRes.status === 'error') {
      throw new Error(
        `Could not build enableModule tx: ${String(enableRes.error)}`
      );
    }

    await signAndExec(
      suite,
      DEPLOYED_SAFE_ADDRESS,
      enableRes.value.txData,
      account
    );

    const isNowEnabled = expectOk(
      await suite.isModuleEnabled(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE),
      'Module should be enabled before disableModule tx'
    );
    expect(isNowEnabled).toBe(true);

    // Now disable
    const disableRes = await suite.buildDisableModuleTx(
      DEPLOYED_SAFE_ADDRESS,
      SENTINEL_ADDRESS,
      DUMMY_MODULE
    );

    if (disableRes.status === 'error') {
      throw new Error(
        `Could not build disableModule tx: ${String(disableRes.error)}`
      );
    }

    await signAndExec(
      suite,
      DEPLOYED_SAFE_ADDRESS,
      disableRes.value.txData,
      account
    );

    const isNowDisabled = expectOk(
      await suite.isModuleEnabled(DEPLOYED_SAFE_ADDRESS, DUMMY_MODULE),
      'Module should be disabled after disableModule tx'
    );
    expect(isNowDisabled).toBe(false);
  });
});
