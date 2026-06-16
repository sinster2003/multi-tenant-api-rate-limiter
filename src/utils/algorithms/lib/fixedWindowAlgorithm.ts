import { redisClient } from "../../../redis/index.js";
import algorithmStrategy from "./algorithmStrategy.js";
import { counterFixedWindowKey, fixedWindowStartKey } from "./constants.js";
import type { Policy } from "./types.js";

class fixedWindowAlgorithm extends algorithmStrategy {
    public async execute(tenantId: string, policy: Policy) {
        try {
            const windowStart = await redisClient.get(fixedWindowStartKey(tenantId, policy.endpoint));

            if(windowStart) {
                const currentTime = Number(new Date());
                const windowStartTime = Number(new Date(windowStart));

                const timeDiff = Math.ceil((currentTime - windowStartTime) / 1000);

                if(timeDiff <= policy.window) {
                    const count = await redisClient.get(counterFixedWindowKey(tenantId, policy.endpoint));
                    const currentCount = Number(count);

                    if(currentCount + 1 > policy.threshold) {
                        // rate limit the request
                        return false;
                    }
                }
                else {
                    // current window exceeds permitted window - create a new fixed window and process current request with count set to 1
                    await redisClient.set(fixedWindowStartKey(tenantId, policy.endpoint), new Date().toISOString());
                    await redisClient.set(counterFixedWindowKey(tenantId, policy.endpoint), 1);
                }
            }
        }
        catch(error) {
            console.log("Internal Server Error");
            console.error(error);
        }
        finally {
            return true; // success or fail-open
        }
    }
}

export default fixedWindowAlgorithm;