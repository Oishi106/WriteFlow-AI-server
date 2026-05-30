import './config/env';
import app from './app';
import { connectDB } from './config/db';
import { config } from './config/env';

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const server = app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║        WriteFlow AI Backend Server         ║
╠═══════════════════════════════════════════╣
║  Status   : Running ✅                     ║
║  Port     : ${config.port}                          ║
║  Env      : ${config.nodeEnv.padEnd(10)}               ║
║  API Base : http://localhost:${config.port}/api    ║
╚═══════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const shutdown = (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
      server.close(() => process.exit(1));
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
