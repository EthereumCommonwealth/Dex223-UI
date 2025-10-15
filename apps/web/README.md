This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## 

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Add new chain checklist

1. Add new network to src/config/wagmi/config.ts 
   1. Networks
   2. Transports
2. Add new network to src/config/networks/index.ts
3. Modify DexChainId to src/sdk_bi/chains.ts
   1. Add new chain to DexChainId enum with [chainId] as value
4. Add contract addresses in src/sdk_bi/addresses.ts
   1. CONVERTER_ADDRESS
   2. FACTORY_ADDRESS
   3. ROUTER_ADDRESS
   4. QUOTER_ADDRESS
   5. NONFUNGIBLE_POSITION_MANAGER_ADDRESS
   6. POOL_INIT_CODE_HASH
   7. CORE_AUTOLISTING
   8. FREE_AUTOLISTING
5. Add WETH9 token in src/sdk_bi/entities.ts
6. Add native currency in src/sdk_bi/entities/ether.ts
7. Add default tokenlist in src/db/lists/index.ts
8. Add subrgaph url in src/graphql/thegraph/apollo.ts
9. Add autolisting subgraph in src/hooks/useAutolistingAppoloClient.ts
10. Add margin-module subgraph in src/hooks/[useMarginModuleApolloClient.ts](hooks/useMarginModuleApolloClient.ts)
11. Add allowanceGasLimit on src/hooks/useAllowance.ts
12. Modify baseFeeMultipliers and eip1559SupportMap in src/config/constants/baseFeeMultilpiers.ts
13. Add explorer links in src/functions/getExplorerLink.ts
14. Add baseGasLimit for useDeposit, unwrapGasLimitMap hooks
