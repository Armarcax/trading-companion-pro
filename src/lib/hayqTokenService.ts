// hayqTokenService.ts — HAYQ Token Gate (real addresses)

import { HAYQ_CONTRACTS, SEPOLIA_CHAIN_ID } from './hayqContracts';

export const HAYQ_REQUIRED_BALANCE = 100; // 100 HAYQ = Premium

// ABI selectors (keccak256 first 4 bytes)
const SIG = {
  balanceOf: '0x70a08231',
  decimals:  '0x313ce567',
  symbol:    '0x95d89b41',
  // Staking: stakedBalance(address)
  stakedOf:  '0x5d9a80c3',
};

export interface TokenCheckResult {
  connected: boolean;
  address?: string;
  walletBalance?: number;
  stakedBalance?: number;
  totalBalance?: number;
  hasEnough: boolean;
  error?: string;
}

// eth_call helper
async function ethCall(to: string, data: string): Promise<string> {
  return (window as any).ethereum.request({
    method: 'eth_call',
    params: [{ to, data }, 'latest'],
  });
}

// Encode address param (padded 32 bytes)
function encodeAddr(addr: string): string {
  return addr.slice(2).toLowerCase().padStart(64, '0');
}

export async function checkHayqTokenBalance(): Promise<TokenCheckResult> {
  const eth = (window as any).ethereum;
  if (!eth) {
    return {
      connected: false,
      hasEnough: false,
      error: 'MetaMask not found. Install MetaMask extension.',
    };
  }

  try {
    // 1. Request accounts
    const accounts: string[] = await eth.request({
      method: 'eth_requestAccounts',
    });
    if (!accounts?.length) {
      return { connected: false, hasEnough: false, error: 'No accounts' };
    }
    const userAddr = accounts[0];

    // 2. Ensure Sepolia
    const chainId: string = await eth.request({ method: 'eth_chainId' });
    if (chainId !== SEPOLIA_CHAIN_ID) {
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
      } catch {
        return {
          connected: true,
          address: userAddr,
          hasEnough: false,
          error: 'Switch to Sepolia network in MetaMask',
        };
      }
    }

    // 3. Get token decimals
    const decimalsHex = await ethCall(
      HAYQ_CONTRACTS.HAYQ_TOKEN,
      SIG.decimals
    );
    const decimals = parseInt(decimalsHex, 16) || 18;

    // 4. Wallet HAYQ balance
    const walletBalHex = await ethCall(
      HAYQ_CONTRACTS.HAYQ_TOKEN,
      SIG.balanceOf + encodeAddr(userAddr)
    );
    const walletBalance =
      Number(BigInt(walletBalHex)) / Math.pow(10, decimals);

    // 5. Staked HAYQ balance (Staking contract)
    let stakedBalance = 0;
    try {
      const stakedHex = await ethCall(
        HAYQ_CONTRACTS.STAKING,
        SIG.balanceOf + encodeAddr(userAddr)
      );
      stakedBalance = Number(BigInt(stakedHex)) / Math.pow(10, decimals);
    } catch {
      // Staking check optional
    }

    const totalBalance = walletBalance + stakedBalance;

    return {
      connected: true,
      address: userAddr,
      walletBalance,
      stakedBalance,
      totalBalance,
      hasEnough: totalBalance >= HAYQ_REQUIRED_BALANCE,
    };
  } catch (e: any) {
    return {
      connected: false,
      hasEnough: false,
      error: e?.message ?? 'Unknown error',
    };
  }
}