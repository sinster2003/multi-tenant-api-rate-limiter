import { createClient } from "redis";
import { REDIS_URL } from "../config/index.js";

const redisClient = createClient({
    url: REDIS_URL || ""
});

async function connectRedis() {
    try {
        await redisClient.connect();
        console.log("Successfully established a connection to redis");
    }
    catch(error) {
        throw error;
    }
}

export default connectRedis;