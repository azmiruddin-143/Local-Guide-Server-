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
