export interface Policy {
    threshold: number
    window: number
    strategy: 'user' | 'app'
    endpoint: string
    bucketSize?: number
    tokensRefillRate?: number
}