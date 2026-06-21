import { redisClient } from "../../redis/index.js";
import AlgorithmStrategy from "./AlgorithmStrategy.js";
import { tokenBucketLastRefillTimestamp, tokenBucketSizeKey } from "./lib/constants.js";
import type { Policy } from "./lib/types.js";

class TokenBucketAlgorithm extends AlgorithmStrategy {
    public async execute(tenantId: string, policy: Policy) {
        try {
            // No of requests <= Bucket Size + Rate of refiller * Time (window)
            const currentTime = Date.now();
            
            const bucketCapacity = policy.bucketSize ?? policy.threshold;

            const refillTokenRate = policy.tokensRefillRate ?? policy.window;

            const bucketSizeKey = tokenBucketSizeKey(tenantId, policy.endpoint);

            const lastRefillTimeKey = tokenBucketLastRefillTimestamp(tenantId, policy.endpoint);

            // initial tokens present in  bucket - initialize if 0
            const bucketValue = await redisClient.get(bucketSizeKey);

            let currentTokens = (bucketValue === null) ? bucketCapacity : Number(bucketValue);

            const lastRefillValue = await redisClient.get(lastRefillTimeKey);

            const lastRefillTimestamp = (lastRefillValue === null) ? currentTime : Number(lastRefillValue);

            if(lastRefillValue === null) {
                await redisClient.set(lastRefillTimeKey, currentTime.toString());
            }
            
            const elapsedSeconds = (currentTime - lastRefillTimestamp) / 1000; // timeDiff

            // continuous refill of tokens preferred over time stamp based refill - round off decimals
            const tokensToAdd = Math.floor(refillTokenRate * elapsedSeconds);

            // update the bucket size and last refill only if tokens can be added
            if(tokensToAdd > 0) {
                // maximum capacity must be of bucket size
                currentTokens = Math.min(bucketCapacity, currentTokens + tokensToAdd);

                await redisClient.set(bucketSizeKey, currentTokens);
                
                await redisClient.set(lastRefillTimeKey, currentTime.toString()); // new refill time
            }
             
            if(currentTokens <= 0) {
                return false; // rate limit request
            }
            
            // token consumption
            await redisClient.decr(bucketSizeKey);

            await redisClient.expire(bucketSizeKey, 86400);

            await redisClient.expire(lastRefillTimeKey, 86400);

            return true; // success
        }
        catch(error) {
            console.log("Internal Server Error");
            console.error(error);
            return true; // fail-open
        }
    }
}

export default TokenBucketAlgorithm;