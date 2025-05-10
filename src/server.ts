import fastify from 'fastify';
import cors from '@fastify/cors';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from './trpc';
import path from 'path';
import fs from 'fs';

// Create Fastify instance
const server = fastify({
  logger: true,
  maxParamLength: 5000,
});

// Register CORS
server.register(cors, {
  origin: true
});

// Register tRPC plugin
server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: { router: appRouter }
});

// Define a health check route
server.get('/health', async () => {
  return { status: 'ok' };
});

// Serve the splash page at root
server.get('/', async (request, reply) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  const content = fs.readFileSync(indexPath, 'utf8');
  reply.type('text/html').send(content);
});

// Start the server
const start = async () => {
  try {
    // Ports >1024 are available to user processes;
    // 3000 is reverse-proxied by Caddy in /etc/caddy/Caddyfile
    await server.listen({ port: 3000, host: '0.0.0.0' });
    console.log(`Server listening on ${server.server.address()}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();