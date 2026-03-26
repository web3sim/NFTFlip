export const RPC_URL = 'https://rpc-testnet.onelabs.cc:443'
export const EXPLORER_URL = 'https://onescan.cc/testnet'
export const PACKAGE_ID = (import.meta.env.VITE_PACKAGE_ID as string | undefined)?.trim() ?? ''

export const txUrl = (digest: string) => `${EXPLORER_URL}/transactionBlocksDetail?digest=${digest}`
export const objectUrl = (id: string) => `${EXPLORER_URL}/objectDetails?address=${id}`
