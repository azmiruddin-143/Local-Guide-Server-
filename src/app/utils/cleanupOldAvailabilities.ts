import mongoose from 'mongoose';

export const cleanupOldAvailabilities = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.log('Database not connected');
      return;
    }

    const collection = db.collection('availabilities');
    
    // Delete all old availabilities with dayOfWeek field
    const result = await collection.deleteMany({ dayOfWeek: { $exists: true } });
    
    console.log(`✓ Deleted ${result.deletedCount} old availability records with dayOfWeek field`);
  } catch (error) {
    console.error('Error cleaning up old availabilities:', error);
    throw error;
  }
};
