import { Server } from 'http';
import mongoose from 'mongoose';
import { envVars } from './app/config/env';
import app from './app';
import { createAdmin } from './app/utils/createAdmin';
import { seedPlatformSettings } from './app/utils/seedPlatformSettings';
import cron from 'node-cron';
import { availabilityServices } from './app/modules/availability/availability.service';
import { migrateAvailabilityIndexes } from './app/utils/migrateAvailabilityIndexes';
import { cleanupOldAvailabilities } from './app/utils/cleanupOldAvailabilities';

let server: Server;

const connectToDB = async () => {
  try {
    await mongoose.connect(envVars.DB_URL);

    console.log('Connected to DB!');

    // Run migrations to fix indexes
    await migrateAvailabilityIndexes();
    
    // Cleanup old availability data with dayOfWeek
    await cleanupOldAvailabilities();

    server = app.listen(envVars.PORT, () => {
      console.log(`Server is Listening to port ${envVars.PORT}`);
    });

    // Setup cron job to cleanup past availabilities every day at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('Running daily availability cleanup...');
      try {
        await availabilityServices.cleanupPastAvailabilities();
        console.log('Availability cleanup completed successfully');
      } catch (error) {
        console.error('Error during availability cleanup:', error);
      }
    });

    console.log('Cron job scheduled: Daily availability cleanup at midnight');
  } catch (error) {
    console.log(error);
  }
};

(async () => {
  await connectToDB();
  await createAdmin();
  await seedPlatformSettings();
})();

process.on('SIGTERM', () => {
  console.log(
    'SIGTERM signal received. Shutting down the server gracefully...'
  );

  if (server) {
    server.close(() => {
      console.log('Server closed.');
      process.exit(1);
    });
  }

  process.exit(1);
});

process.on('SIGINT', () => {
  console.log(
    'SIGINT signal received (e.g. Ctrl+C). Shutting down the server gracefully...'
  );
  if (server) {
    server.close(() => {
      console.log('Server closed.');
      process.exit(1);
    });
  }

  process.exit(1);
});

process.on('unhandledRejection', err => {
  console.log(
    'Unhandled Promise Rejection detected. Shutting down the server...',
    err
  );

  if (server) {
    server.close(() => {
      console.log('Server closed.');
      process.exit(1);
    });
  }

  process.exit(1);
});

process.on('uncaughtException', err => {
  console.log('Uncaught Exception detected. Shutting down the server...', err);

  if (server) {
    server.close(() => {
      console.log('Server closed.');
      process.exit(1);
    });
  }

  process.exit(1);
});
