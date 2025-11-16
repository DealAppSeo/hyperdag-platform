# HyperDAG - Lovable.dev Integration Guide

This guide provides instructions for integrating the HyperDAG sidebar and APIs with your Lovable.dev forum at `hyperverse-buzz-feed.lovable.app`.

## 1. Sidebar Integration

### Step 1: Copy the HyperDAG Sidebar Component
Copy the `hyperdag-sidebar.jsx` component to your project. This component provides the same navigation structure as the main HyperDAG platform.

### Step 2: Add the Required Styles
Make sure your project includes Tailwind CSS. The sidebar component uses Tailwind classes for styling.

### Step 3: Implement the Sidebar in Your Layout
Add the sidebar to your forum layout:

```jsx
import HyperDAGSidebar from './path/to/hyperdag-sidebar';

function ForumLayout({ children }) {
  // Get the current path
  const currentPath = window.location.pathname;
  
  return (
    <div className="flex min-h-screen">
      <HyperDAGSidebar currentPath={currentPath} />
      <main className="flex-1">
        {/* Your forum content */}
        {children}
      </main>
    </div>
  );
}
```

### Step 4: Customize the Primary Color
To match HyperDAG's branding, set your primary color to `#4F46E5` (indigo-600) in your Tailwind config.

## 2. API Integration

The HyperDAG API allows you to verify users, check SBT ownership, and access reputation data.

### Step 1: Authentication
To make API calls to HyperDAG, you'll need an API key:

1. Contact us to get a partner API key
2. Include the API key in all your requests:

```js
const headers = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
};
```

### Step 2: User Verification
Check if a user has a valid HyperDAG account:

```js
async function verifyHyperDAGUser(username) {
  try {
    const response = await fetch('https://api.hyperdag.org/api/external/verify-user', {
      method: 'POST',
      headers,
      body: JSON.stringify({ username })
    });
    
    const data = await response.json();
    return data.verified;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
}
```

### Step 3: SBT Verification
Verify if a user owns specific Soulbound Tokens:

```js
async function checkSBTOwnership(username, tokenType) {
  try {
    const response = await fetch('https://api.hyperdag.org/api/external/verify-sbt', {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, tokenType })
    });
    
    const data = await response.json();
    return data.hasToken;
  } catch (error) {
    console.error('Error checking SBT ownership:', error);
    return false;
  }
}
```

### Step 4: Get Reputation Score
Retrieve a user's reputation score:

```js
async function getUserReputation(username) {
  try {
    const response = await fetch('https://api.hyperdag.org/api/external/reputation', {
      method: 'POST',
      headers,
      body: JSON.stringify({ username })
    });
    
    const data = await response.json();
    return data.reputationScore;
  } catch (error) {
    console.error('Error getting reputation:', error);
    return 0;
  }
}
```

## 3. Deep Linking

Enable seamless navigation between HyperDAG and your forum:

### From HyperDAG to Forum
We've added a link in our sidebar that points to your forum: `https://hyperverse-buzz-feed.lovable.app`

### From Forum to HyperDAG
Use these links to redirect to specific HyperDAG pages:

- Home: `https://hyperdag.org/`
- User Profile: `https://hyperdag.org/my-dashboard`
- GrantFlow: `https://hyperdag.org/grantflow`
- Nonprofit Hub: `https://hyperdag.org/nonprofits`

## 4. Implementation Timeline

1. **Week 1**: Set up sidebar integration
2. **Week 2**: Implement API integration (user verification)
3. **Week 3**: Add SBT verification and reputation display
4. **Week 4**: Test and refine the integration

## 5. Contact Information

If you need any assistance with the integration, please contact:
- Technical Support: dev@hyperdag.org
- API Access: api@hyperdag.org

---

This integration will create a seamless experience for users while allowing both platforms to maintain their independence and focus on their core strengths.