import { redisClient } from "../../redis/index.js";
import AlgorithmStrategy from "./AlgorithmStrategy.js";
import { slidingWindowTimestampLogKey } from "./lib/constants.js";
import type { Policy } from "./lib/types.js";

class SlidingWindowAlgorithm extends AlgorithmStrategy {
    public async execute(tenantId: string, policy: Policy) {
        try {
            const currentTimestamp = new Date(); // current time represents the end of new sliding window
            
            const currentTime = Number(currentTimestamp);

            const permittedWindow = policy.window;

            const newWindowStart = currentTime - permittedWindow;

            const timestampLog = slidingWindowTimestampLogKey(tenantId, policy.endpoint);

            const lastElement = await redisClient.lIndex(timestampLog, -1);

            if(lastElement) {
                let lastElementTime = Number(new Date(lastElement));

                while(lastElementTime < newWindowStart) {
                    await redisClient.rPop(timestampLog);
                    const lastElement = await redisClient.lIndex(timestampLog, -1);

                    if(!lastElement) {
                        break;
                    }

                    lastElementTime = Number(new Date(lastElement));
                }
            }

            const logSize = await redisClient.lLen(timestampLog);

            if(logSize >= policy.threshold) {
                return false; // rate limit - number of requests in the window is equal to or greater than threshold
            }
            
            await redisClient.lPush(timestampLog, currentTimestamp.toISOString()); // log the forwarded request timestamp
        }
        catch(error) {
            console.log("Internal Server Error");
            console.log(error);
        }
        finally {
            return true; // success or fail-open
        }
    }
}