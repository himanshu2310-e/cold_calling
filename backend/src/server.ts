// ============================================
// Server Entry Point
// ============================================
import http from 'http';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import app from './app';
import env from './config/env';
import connectDatabase from './config/database';
import configureCloudinary from './config/cloudinary';
import { initializeSocket } from './sockets';
import { checkAndSendReminders } from './services/followup.service';

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // 2. Configure Cloudinary
    configureCloudinary();

    // 3. Create HTTP server (needed for Socket.io)
    const httpServer = http.createServer(app);

    // 4. Initialize Socket.io
    initializeSocket(httpServer);

    // Start follow-up checker interval (every 5 minutes)
    setInterval(() => {
      checkAndSendReminders().catch((err) => console.error('Follow-up checker error:', err));
    }, 5 * 60 * 1000);

    // 5. Start listening
    httpServer.listen(env.PORT, () => {
      console.log('');
      console.log('===========================================');
      console.log('  🚀 ColdConnect CRM API Server');
      console.log('===========================================');
      console.log(`  Environment : ${env.NODE_ENV}`);
      console.log(`  Port        : ${env.PORT}`);
      console.log(`  API         : http://localhost:${env.PORT}/api/v1`);
      console.log(`  Health      : http://localhost:${env.PORT}/api/v1/health`);
      console.log('===========================================');
      console.log('');
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      httpServer.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
