import mongoose from 'mongoose';

export const migrateAvailabilityIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.log('Database not connected');
      return;
    }

    const collection = db.collection('availabilities');
    
    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('Existing indexes:', indexes.map(i => i.name));

    // Drop old dayOfWeek index if exists
    const oldIndexName = 'guideId_1_dayOfWeek_1';
    const hasOldIndex = indexes.some(i => i.name === oldIndexName);
    
    if (hasOldIndex) {
      console.log(`Dropping old index: ${oldIndexName}`);
      await collection.dropIndex(oldIndexName);
      console.log('Old index dropped successfully');
    } else {
      console.log('Old index not found, skipping drop');
    }

    // Create new index if not exists
    const newIndexName = 'guideId_1_specificDate_1_startTime_1';
    const hasNewIndex = indexes.some(i => i.name === newIndexName);
    
    if (!hasNewIndex) {
      console.log('Creating new index...');
      await collection.createIndex(
        { guideId: 1, specificDate: 1, startTime: 1 },
        { unique: true, name: newIndexName }
      );
      console.log('New index created successfully');
    } else {
      console.log('New index already exists');
    }

    console.log('✓ Availability indexes migration completed');
  } catch (error) {
    console.error('Error migrating availability indexes:', error);
    throw error;
  }
};
