import path from 'path';
import { fileURLToPath } from 'url';
import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { createServer as createViteServer } from 'vite';
import { appRouter } from './server/routers/root';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import jwt from '@fastify/jwt';
import oauth2 from '@fastify/oauth2';
import vite from '@fastify/vite';
import { prisma } from './server/db';
import { TRPCError } from '@trpc/server';

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-token-that-should-be-changed-in-production';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

// Get dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create Fastify instance
const server = fastify({
  logger: true,
  maxParamLength: 5000,
  trustProxy: true,
});

// Register plugins
server.register(cors, {
  origin: true,
  credentials: true,
});

// JWT for authentication
server.register(jwt, {
  secret: JWT_SECRET,
  sign: {
    expiresIn: '7d',
  },
});

// Environment variables for Google OAuth
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

// OAuth2 for GitHub
if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  server.register(oauth2, {
    name: 'githubOAuth2',
    scope: ['user:email'],
    credentials: {
      client: {
        id: GITHUB_CLIENT_ID,
        secret: GITHUB_CLIENT_SECRET,
      },
      auth: {
        authorizeHost: 'https://github.com',
        authorizePath: '/login/oauth/authorize',
        tokenHost: 'https://github.com',
        tokenPath: '/login/oauth/access_token',
      },
    },
    startRedirectPath: '/auth/github',
    callbackUri: `${PUBLIC_URL}/auth/github/callback`,
  });
}

// OAuth2 for Google
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  server.register(oauth2, {
    name: 'googleOAuth2',
    scope: ['email', 'profile'],
    credentials: {
      client: {
        id: GOOGLE_CLIENT_ID,
        secret: GOOGLE_CLIENT_SECRET,
      },
      auth: {
        authorizeHost: 'https://accounts.google.com',
        authorizePath: '/o/oauth2/v2/auth',
        tokenHost: 'https://oauth2.googleapis.com',
        tokenPath: '/token',
      },
    },
    startRedirectPath: '/auth/google',
    callbackUri: `${PUBLIC_URL}/auth/google/callback`,
  });
}

// Static file serving for client files
if (!isProduction) {
  // In development mode, serve files from client directory
  server.register(staticPlugin, {
    root: path.join(process.cwd(), 'client'),
    prefix: '/'
  });
} else {
  // In production mode, serve files from client/dist directory
  server.register(staticPlugin, {
    root: path.join(process.cwd(), 'client', 'dist'),
    prefix: '/'
  });
}

// Create JWT authentication decorator
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

// Authentication decorator plugin
const authenticate = fastifyPlugin(async (server) => {
  server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
});

server.register(authenticate);

// User authentication context
const createContext = async ({ req }: { req: FastifyRequest }) => {
  let userId: string | undefined;
  
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = server.jwt.verify<{ id: string }>(token);
      userId = decoded.id;
    }
  } catch (err) {
    // Invalid token, no user id
  }

  return {
    prisma,
    session: userId ? { userId } : null,
  };
};

// Register tRPC plugin
server.register(fastifyTRPCPlugin, {
  prefix: '/trpc',
  trpcOptions: {
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      // Log errors
      server.log.error(`Error in tRPC path ${path}: ${error.message}`);
    },
  },
});

// In development mode, setup Vite for frontend - Skipping for now to avoid conflicts with our static file serving
// if (!isProduction) {
//   server.register(vite, {
//     root: path.join(process.cwd(), 'client'),
//     dev: true,
//     spa: true,
//   });
// }

// Root route handler to serve client/index.html
server.get('/', async (request, reply) => {
  try {
    return reply.sendFile('index.html');
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
});

// Health check endpoint
server.get('/health', async () => {
  return { status: 'ok' };
});

// SPA fallback route - serve index.html for all non-API routes (client-side routing)
server.setNotFoundHandler((request, reply) => {
  const url = request.url;

  // Skip API routes and known server routes
  if (url.startsWith('/trpc') ||
      url.startsWith('/api') ||
      url.startsWith('/login/github') ||
      url.includes('.')) {
    reply.code(404).send({ error: 'Not Found' });
    return;
  }

  // For all other routes, serve the SPA
  try {
    return reply.sendFile('index.html');
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal Server Error' });
  }
});

// GitHub OAuth callback route
server.get('/auth/github/callback', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { token } = await server.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

    // Fetch user profile from GitHub API
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch GitHub user');
    }

    const githubUser = await userResponse.json();

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { oauthId: `github_${githubUser.id.toString()}` },
      update: {
        name: githubUser.name || githubUser.login,
        avatarUrl: githubUser.avatar_url,
      },
      create: {
        oauthId: `github_${githubUser.id.toString()}`,
        name: githubUser.name || githubUser.login,
        avatarUrl: githubUser.avatar_url,
      },
    });

    // Create JWT token
    const jwtToken = server.jwt.sign({ id: user.id });

    // Redirect to frontend with token
    return reply.redirect(`/?token=${jwtToken}`);
  } catch (error) {
    request.log.error(error);
    return reply.redirect('/?error=authentication_failed');
  }
});

// Google OAuth callback route
server.get('/auth/google/callback', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { token } = await server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

    // Fetch user profile from Google API
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch Google user');
    }

    const googleUser = await userResponse.json();

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { oauthId: `google_${googleUser.id.toString()}` },
      update: {
        name: googleUser.name,
        avatarUrl: googleUser.picture,
      },
      create: {
        oauthId: `google_${googleUser.id.toString()}`,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
      },
    });

    // Create JWT token
    const jwtToken = server.jwt.sign({ id: user.id });

    // Redirect to frontend with token
    return reply.redirect(`/?token=${jwtToken}`);
  } catch (error) {
    request.log.error(error);
    return reply.redirect('/?error=authentication_failed');
  }
});

// Current user endpoint
server.get(
  '/api/me',
  { preHandler: server.authenticate as any },
  async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: request.user.id },
      });
      
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }
      
      return { user };
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  }
);

// Error handler
server.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  
  // Handle tRPC errors
  if (error instanceof TRPCError) {
    const statusCode = getHTTPStatusCodeFromError(error);
    return reply.code(statusCode).send({
      error: error.code,
      message: error.message,
    });
  }
  
  // Handle other errors
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  return reply.code(statusCode).send({
    error: statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST',
    message: statusCode >= 500 && isProduction ? 'Internal Server Error' : message,
  });
});

// Helper function to convert tRPC error to HTTP status code
function getHTTPStatusCodeFromError(error: TRPCError): number {
  switch (error.code) {
    case 'BAD_REQUEST':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'METHOD_NOT_SUPPORTED':
      return 405;
    case 'TIMEOUT':
      return 408;
    case 'CONFLICT':
      return 409;
    case 'PRECONDITION_FAILED':
      return 412;
    case 'PAYLOAD_TOO_LARGE':
      return 413;
    case 'UNPROCESSABLE_CONTENT':
      return 422;
    case 'TOO_MANY_REQUESTS':
      return 429;
    case 'CLIENT_CLOSED_REQUEST':
      return 499;
    case 'INTERNAL_SERVER_ERROR':
      return 500;
    default:
      return 500;
  }
}

// Start the server
const start = async () => {
  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`Server listening on ${server.server.address()}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
start();