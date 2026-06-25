import { redisClient } from "../../redis/index.js";
import AlgorithmStrategy from "./AlgorithmStrategy.js";
import { slidingWindowTimestampLogKey } from "./lib/constants.js";
import type { Policy } from "./lib/types.js";

/* Note: Sliding window is of O(N) complexity where N is number of timestamp logs in worst case scenario */

class SlidingWindowAlgorithm extends AlgorithmStrategy {
    public async execute(tenantId: string, policy: Policy) {
        try {
            const currentTime = Date.now(); // current time represents the end of new sliding window
            
            const permittedWindow = policy.window; // validated always >= 1 and in seconds

            const windowStart = currentTime - (permittedWindow * 1000); // permitted window converted into milliseconds

            const timestampLogKey = slidingWindowTimestampLogKey(tenantId, policy.endpoint);

            while(true) {
                const lastLogValue = await redisClient.lIndex(timestampLogKey, -1);

                if(lastLogValue === null) {
                    break; // timestamp log is empty
                }

                const lastLog = Number(lastLogValue);

                if (lastLog >= windowStart) {
                    break; // timestamp log within allowed sliding window
                }

                await redisClient.rPop(timestampLogKey);
            }

            const logSize = await redisClient.lLen(timestampLogKey);
            
            // threshold >= 1 always
            if(logSize >= policy.threshold) {
                return false; // rate limit - number of requests in the window is equal to or greater than threshold
            }
            
            await redisClient.lPush(timestampLogKey, currentTime.toString()); // log the forwarded request timestamp
            
            await redisClient.expire(timestampLogKey, permittedWindow);

            return true; // success
        }
        catch(error) {
            console.log("Internal Server Error");
            console.log(error);
            return true; // fail-open
        }
    }
}

export default SlidingWindowAlgorithm;