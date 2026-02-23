# FlowForge Frontend

Next.js app with React Flow canvas, block-based node library, Privy and Safe wallet integration. Part of the FlowForge stack—communicates with the backend API for workflows, swap/lending, and integrations.

## Project Structure

```bash
frontend/
├── src/
│   ├── app/              # Next.js App Router (automation-builder, workflows, public-workflows)
│   ├── blocks/           # Definitions, configs, nodes (see src/blocks/README.md)
│   ├── components/       # UI, layout, workspace
│   ├── config/           # API, AI config
│   ├── context/          # Workflow, onboarding, Safe
│   ├── hooks/            # Custom hooks
│   ├── lib/              # API client, utils
│   ├── types/            # TypeScript types
│   ├── utils/            # Canvas, workflow helpers
│   └── web3/             # Chains, Safe, Privy
├── public/
└── package.json
```

## Setup & Run

**Prerequisites:** Node.js 20+, running backend

```bash
yarn
```

Create `.env.local` with:

| Variable | Description |
| -------- | ----------- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL (no trailing slash), e.g. `http://localhost:3000/api/v1` |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID for embedded wallet auth |

| `NEXT_PUBLIC_SAFE_WALLET_FACTORY_ADDRESS_421614` | Safe factory (Arbitrum Sepolia) |
| `NEXT_PUBLIC_SAFE_MODULE_ADDRESS_421614` | Safe module (Arbitrum Sepolia) |
| `NEXT_PUBLIC_SAFE_WALLET_FACTORY_ADDRESS_42161` | Safe factory (Arbitrum Mainnet) |
| `NEXT_PUBLIC_SAFE_MODULE_ADDRESS_42161` | Safe module (Arbitrum Mainnet) |

```bash
yarn run dev
```

| Command | Description |
| ------- | ----------- |
| `yarn run dev` | Start dev server |
| `yarn run build` | Build for production |
| `yarn run start` | Start production server |
| `yarn run lint` | ESLint |

## Block system

Blocks use a convention-based structure. Each block has:

- **Definition** (`src/blocks/definitions/`) — Metadata and backend type mapping
- **Config** (`src/blocks/configs/`) — Sidebar configuration UI
- **Node** (`src/blocks/nodes/`) — Canvas node component

See `src/blocks/README.md` for naming conventions and how to add new blocks.

## Tech stack

Next.js 16, React 19, React Flow, Tailwind v4, Radix UI, CVA, Privy, Safe (protocol-kit, api-kit), viem, ethers, TanStack Query.

## LICENSE

[MIT License](LICENSE)
