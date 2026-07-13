// ============================================
// Socket.io Setup
// ============================================
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/token';
import User from '../models/User';
import env from '../config/env';

let io: Server;

/**
 * Initialize Socket.io server with JWT authentication.
 */
export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive || user.isSuspended) {
        return next(new Error('Authentication failed'));
      }

      // Attach user info to socket
      (socket as any).userId = user._id.toString();
      (socket as any).userRole = user.role;

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = (socket as any).userId;
    console.log(`🔌 User connected: ${userId}`);

    // Join user's personal room for targeted notifications
    socket.join(`user:${userId}`);

    // Update user online status
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Broadcast to admins that a user came online
    io.emit('user:online', { userId });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${userId}`);
      await User.findByIdAndUpdate(userId, { isOnline: false });
      io.emit('user:offline', { userId });
    });

    // Handle joining rooms (e.g., lead-specific rooms)
    socket.on('join:room', (room: string) => {
      socket.join(room);
    });

    socket.on('leave:room', (room: string) => {
      socket.leave(room);
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
};

/**
 * Get the Socket.io instance (for emitting from services).
 */
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
