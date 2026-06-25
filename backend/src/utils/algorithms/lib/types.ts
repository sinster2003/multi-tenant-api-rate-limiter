export interface Policy {
    threshold: number // >= 1
    window: number // in seconds and >= 1
    strategy: 'user' | 'app'
    endpoint: string
    bucketSize?: number
    tokensRefillRate?: number
}