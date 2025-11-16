// Quick GitHub token test script
import { Octokit } from '@octokit/rest';

async function testGitHubToken() {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.log('❌ No GITHUB_TOKEN found in environment');
    return;
  }
  
  try {
    const octokit = new Octokit({ auth: token });
    
    // Test basic authentication
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log('✅ GitHub token works!');
    console.log(`🔑 Authenticated as: ${user.login}`);
    console.log(`📧 Email: ${user.email || 'Not public'}`);
    console.log(`👥 Account type: ${user.type}`);
    
    // Test repository access
    const repos = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 10,
      sort: 'updated'
    });
    
    console.log(`📁 Your repositories (${repos.data.length} shown):`);
    repos.data.forEach(repo => {
      console.log(`  - ${repo.name} (${repo.private ? 'private' : 'public'}) - ${repo.description || 'No description'}`);
    });
    
    // Check if trinity-symphony-shared already exists
    const hasTrinityRepo = repos.data.find(repo => repo.name.includes('trinity') || repo.name.includes('symphony'));
    if (hasTrinityRepo) {
      console.log(`\n🎯 Found existing Trinity-related repo: ${hasTrinityRepo.name}`);
      console.log(`   Recommendation: Use this existing repository`);
    } else {
      console.log(`\n💡 Recommendation: Create new 'trinity-symphony-shared' repository`);
      console.log(`   This will keep collaboration files organized and easy to share`);
    }
    
    return { success: true, username: user.login, email: user.email };
    
  } catch (error) {
    console.log('❌ GitHub token test failed:');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run the test
testGitHubToken()
  .then(result => {
    if (result && result.success) {
      console.log('\n🚀 Ready to use GitHub for file sharing and collaboration!');
    } else {
      console.log('\n⚠️  Please check your GitHub token setup.');
    }
  })
  .catch(console.error);