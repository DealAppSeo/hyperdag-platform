import { runMigration } from './add_settings_column';

// Run the migration
runMigration()
  .then(success => {
    if (success) {
      console.log('Migration completed successfully');
      process.exit(0);
    } else {
      console.error('Migration failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Migration error:', error);
    process.exit(1);
  });