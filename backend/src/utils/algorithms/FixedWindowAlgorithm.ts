import { redisClient } from "../../redis/index.js";
import AlgorithmStrategy from "./AlgorithmStrategy.js";
import { counterFixedWindowKey } from "./lib/constants.js";
import type { Policy } from "./lib/types.js";

class FixedWindowAlgorithm extends AlgorithmStrategy {
    public async execute(tenantId: string, policy: Policy) {
        try {
            const counterKey = counterFixedWindowKey(tenantId, policy.endpoint)
            
            const count = await redisClient.get(counterKey);

            if(count !== null) {
                const requestCount = Number(count);

                if(!Number.isInteger(requestCount) || requestCount < 0) {
                    throw new Error("Corrupted fixed-window counter in Redis");
                }

                if(requestCount + 1 > policy.threshold) {
                    // rate limit the request
                    return false;
                }

                await redisClient.incr(counterKey);

                return true; // success
            }

            await redisClient.set(counterKey, "1", {
                expiration: {
                    type: "EX",
                    value: policy.window
                }
            });

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