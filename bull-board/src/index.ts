import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { Queue } from "bullmq";
import { serveStatic } from "@hono/node-server/serve-static";

// Environment variables
const port = process.env.BULL_BOARD_PORT
  ? parseInt(process.env.BULL_BOARD_PORT)
  : 3001;
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT
  ? parseInt(process.env.REDIS_PORT)
  : 6379;

// Redis connection
const redisConnection = {
  host: redisHost,
  port: redisPort,
};

// Initialize Hono app
const app = new Hono();

// Queue names from your codebase
const queueNames = ["video-processing"];

// Create BullMQ adapters for each queue
const queues = queueNames.map(
  (name) => new Queue(name, { connection: redisConnection })
);
const bullAdapters = queues.map((queue) => new BullMQAdapter(queue));

// Initialize Bull Board
const serverAdapter = new HonoAdapter(serveStatic);
createBullBoard({
  queues: bullAdapters,
  serverAdapter,
});

// Mount the Bull Board UI
serverAdapter.setBasePath("/admin/queues");
app.route("/admin/queues", serverAdapter.registerPlugin());

// Root redirect to Bull Board
app.get("/", (c) => c.redirect("/admin/queues"));

// Start the server
console.log(`Bull Board is running on port ${port}`);
console.log(`Access the dashboard at http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
