## Overview

SuperCluster UI is a Next.js App Router dApp that lets users wrap, stake, request withdrawals, and claim USDC on Base Sepolia. It relies on Wagmi, Web3Modal, and custom smart contract ABIs, so a proper environment configuration is required before the screens become functional.

## Prerequisites

- Node.js `18.18+` or `20+` (recommended: match the version in your deployment pipeline).
- npm `9+` (or switch scripts to the package manager of your choice).
- Base Sepolia testnet wallet with test ETH to pay for gas.
- Deployed instances of the SuperCluster protocol contracts on Base Sepolia (addresses listed below).
- WalletConnect Cloud project (free) to obtain a `projectId` for Web3Modal.

Install dependencies once:

```bash
npm install
```

## Environment variables

Create a `.env.local` in the repo root and provide all required values. The client will throw on boot when any key is missing.

```ini
NEXT_PUBLIC_PROJECT_ID=                       # WalletConnect Cloud project id for Web3Modal
NEXT_PUBLIC_SUPERCLUSTER_ADDRESS=             # SuperCluster core contract
NEXT_PUBLIC_PILOT_ADDRESS=                    # Pilot/validator contract configured for withdrawals
NEXT_PUBLIC_MOCK_USDC_ADDRESS=                # ERC20 token used as USDC representation
NEXT_PUBLIC_FAUCET_ADDRESS=                   # Faucet contract if you expose drip actions
NEXT_PUBLIC_WITHDRAW_MANAGER_ADDRESS=         # WithdrawManager contract handling claims
NEXT_PUBLIC_STOKEN_ADDRESS=                   # sUSDC ERC20 (SuperCluster interest-bearing token)
NEXT_PUBLIC_WSTOKEN_ADDRESS=                  # wsUSDC wrapped token (if used in wrapping flows)
```

All values must be Base Sepolia addresses (checksum format). When working with multiple environments, create one `.env.local` per environment (for example `.env.development.local`, `.env.preview.local`) and ensure your deployment platform injects the same keys.

## Onchain setup checklist

- Verify the SuperCluster deployment exposes the `withdraw` method expected by `SUPERCLUSTER_ABI`.
- Ensure the WithdrawManager contract implements:
  - `getRequestsOf(address)` returning array of `uint256` ids.
  - `requests(uint256)` returning `(address user, uint256 sAmount, uint256 baseAmount, uint256 requestedAt, uint256 availableAt, bool finalized, bool claimed)`.
  - `claim(uint256 requestId)` callable once a request is ready.
- Confirm `sToken()` on the SuperCluster contract returns the configured sUSDC address (used by `useTokenBalance`).
- Fund the WithdrawManager with test USDC and configure your operator flows so that requests transition to `finalized` and `availableAt <= block.timestamp` to unlock claims.
- Optionally set up a pilot/validator selection mechanism; the UI persists the selected pilot in `localStorage` under the key `supercluster.selectedPilot`.

## Running locally

```bash
npm run dev            # starts Next.js (Turbopack) on http://localhost:3000
npm run lint           # type-aware ESLint checks
npm run build          # production build (Turbopack)
```

When the UI loads, connect a wallet that is already switched to Base Sepolia. The app will prompt to switch chains if you are on a different network.

## Testing interactions

- Use the Wrap/Deposit page to mint sUSDC or wsUSDC against your test USDC balance.
- Create withdrawal requests from `/withdrawals/request`; the TX hashes will link out to BaseScan.
- Monitor `/withdrawals/claim` to confirm state transitions to `Ready` and trigger `claim`.
- For QA, keep the browser console open; the hooks already surface detailed errors (user rejection, wrong chain, insufficient balances).

## Deployment notes

- The front-end only requires HTTPS hosting with static + Node runtime support (Vercel works out of the box).
- Make sure your deployment environment injects the same `.env` keys, otherwise `src/contracts/addresses.ts` will throw during build.
- If you plan to expose Farcaster Frames, deploy an additional serverless handler that responds with `fc:frame:*` metadata and re-use the same onchain interactions in an auth-safe way.
