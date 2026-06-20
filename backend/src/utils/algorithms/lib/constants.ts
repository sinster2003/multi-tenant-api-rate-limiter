
export function fixedWindowStartKey(tenantId: string, endpoint: string) {
    return `fixed:window:${tenantId}:${endpoint}`;
}

export function counterFixedWindowKey(tenantId: string, endpoint: string) {
    return `counter:fixed:window:${tenantId}:${endpoint}`;
}

export function slidingWindowTimestampLogKey(tenantId: string, endpoint: string) {
    return `sliding:window:log:${tenantId}:${endpoint}`;
}