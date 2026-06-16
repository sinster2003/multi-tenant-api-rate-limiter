import app from "./app.js";
import { PORT } from "./config/index.js";
import connectRedis from "./redis/index.js";

async function startServer() {
    try {
        await connectRedis();
        app.listen(PORT, () => {
            console.log(`Server running at PORT ${PORT}`)
        });
    }
    catch(error) {
        console.log("Failed to establish a connection with redis");
        console.error(error);
        process.exit(1);
    }
}

startServer();
