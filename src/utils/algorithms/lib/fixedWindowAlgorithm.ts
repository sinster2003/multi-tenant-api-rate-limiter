import algorithmStrategy from "./algorithmStrategy.js";
import type { Policies } from "./types.js";

class fixedWindowAlgorithm extends algorithmStrategy {
    public execute(policies: Policies) {
        // if windowStart for a tenant endpoint does not exist -> create a window start timestamp in redis

        // this timestamp is used to determine the fixed window (currentTime - windowStart > window -> create a new fixed window)

        // this steps must happen: if current time - windowStart <= window
        // read counter from redis based on policy strategy

        // if counter + 1 exceeds threshold -> 429 too many requests

        // else increment the counter and forward request

        // if time - windowstart > window meaning old window is deprecated new window
        // set counter of request 1 in redis -> assuming threshold is always >= 1  
    }
}