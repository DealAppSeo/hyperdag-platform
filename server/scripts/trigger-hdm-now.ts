import { processTrinityTasks } from '../services/trinity/consumer-loop.js';

console.log('\n╔═══════════════════════════════════════════════════╗');
console.log('║   🚀 MANUAL HDM EXECUTION TRIGGERED 🚀           ║');
console.log('╚═══════════════════════════════════════════════════╝\n');

console.log('⚡ Bypassing 5-minute wait...');
console.log('⚡ Processing tasks NOW...\n');

processTrinityTasks()
  .then(() => {
    console.log('\n✅ HDM execution cycle complete!');
    console.log('📊 Check Supabase for updated task statuses');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error during execution:', error);
    process.exit(1);
  });
