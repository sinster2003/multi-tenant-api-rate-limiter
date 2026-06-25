import { redisClient } from "../../redis/index.js";
import AlgorithmStrategy from "./AlgorithmStrategy.js";
import { counterFixedWindowKey, fixedWindowStartKey } from "./lib/constants.js";
import type { Policy } from "./lib/types.js";

class FixedWindowAlgorithm extends AlgorithmStrategy {
    public async execute(tenantId: string, policy: Policy) {
        try {
            const currentTime = Date.now();

            const windowStartKey = fixedWindowStartKey(tenantId, policy.endpoint);

            const counterKey = counterFixedWindowKey(tenantId, policy.endpoint)

            const windowStart = await redisClient.get(windowStartKey);

            if(windowStart) {
                const windowStartTime = Number(windowStart);

                const timeDiff = Math.ceil((currentTime - windowStartTime) / 1000);

                if(timeDiff <= policy.window) {
                    const count = await redisClient.get(counterKey);

                    const currentCount = Number(count);

                    if(currentCount + 1 > policy.threshold) {
                        // rate limit the request
                        return false;
                    }

                    await redisClient.incr(counterKey);

                    return true; // success
                }
            }

            await redisClient.set(windowStartKey, currentTime.toString());

            await redisClient.set(counterKey, 1);

            return true; // success
        }
        catch(error) {
            console.log("Internal Server Error");
            console.error(error);
            return true; // fail-open
        }
    }
}

export default FixedWindowAlgorithm;