import type { Policy } from "./lib/types.js";

abstract class algorithmStrategy {
    abstract execute(tenantId: string, policy: Policy) : Promise<boolean>;
}

export default algorithmStrategy;