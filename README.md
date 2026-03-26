# NFTFlip

NFTFlip is a OneChain on-chain collectible game where each mint produces a rarity tier directly from contract logic. Every mint is transparent and traceable through emitted events.

## Highlights

- On-chain mint outcomes with no off-chain randomness dependency
- Tiered rarity model: Common, Rare, Epic
- Shared machine object for global game state
- Wallet-based play from a React frontend
- Live event-driven UI panels

## Testnet Deployment

- Network: OneChain testnet
- RPC: https://rpc-testnet.onelabs.cc:443
- Explorer: https://onescan.cc/testnet
- Package ID: `0x71a7ceb050b8a5baa82ef9cd0a694c336099f1b5277db5f57896bfae07783aad`
- Publish Tx: `8VLzWrn7bXdf3unhVjRzHWAFamKFewSh52okuYHGMJtw`
- Shared Machine Object: `0x0b7271fb67b2b8253a897ec65c3aef333bd8c8105d86d8ed0d5b83933689876c`

Smoke calls:
- `create_machine`: `3uDrnH1EPLiebGkySiqrrwvoZSg6c2qMAcSDzCZqQw8h` (Success)
- `mint`: `BwNssSV43EdDGwUQqUPhHgGocyXgLQ4NJH2PKYw3ijx8` (Success)

## Project Layout

- `contracts/` Move package
- `contracts/sources/nft_flip.move` game logic
- `frontend/` Vite + React + TypeScript app
- `frontend/src/components/GuessArena.tsx` gameplay UI

## Smart Contract API

Module file: `contracts/sources/nft_flip.move`

Public entry functions:
- `create_machine(ctx)`
- `mint(machine, ctx)`

Main events:
- `MachineCreated`
- `FlipMinted` with fields such as `machine_id` and `rarity`

Rarity mapping used in UI:
- `0` -> Common
- `1` -> Rare
- `2` -> Epic

## Frontend Features

- Connect wallet and sign transactions
- Create or load a machine object
- Mint with one click and show tx digest links
- Poll event streams to refresh lists
- Show historical mints with human-readable rarity labels

## Environment

Set `frontend/.env`:

```env
VITE_PACKAGE_ID=0x71a7ceb050b8a5baa82ef9cd0a694c336099f1b5277db5f57896bfae07783aad
```

## Build and Run

Contract:

```bash
cd contracts
one move build --path .
one client publish --gas-budget 50000000 .
```

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run build
```

## Manual Test Flow

1. Connect wallet in the frontend.
2. Create a machine if you do not have one.
3. Mint multiple times.
4. Confirm each tx is successful and appears on explorer.
5. Confirm event history updates with rarity labels.

## Troubleshooting

- `No package ID configured`: verify `VITE_PACKAGE_ID` in `frontend/.env`.
- `Insufficient gas`: fund the active address and retry.
- `Invalid machine object`: ensure object exists and belongs to this deployed package.
- Build warning about chunk size is non-blocking unless you need aggressive bundle optimization.
