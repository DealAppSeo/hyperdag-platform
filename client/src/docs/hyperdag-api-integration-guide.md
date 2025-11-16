# HyperDAG API Integration Guide

This guide provides essential information for integrating with HyperDAG's ZKP SBT verification system using our API endpoints.

## Quick Start

### 1. Generate an API Key

To get started, you'll need an API key:

1. Create a HyperDAG account
2. Navigate to Developer Settings
3. Generate a new API key
4. Save your API key securely - it won't be displayed again

### 2. Authentication

All API requests require authentication using your API key in the header:

```javascript
const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': 'your-api-key-here'
};
```

## API Endpoints

### Verify API Key

```
GET /api/external/verify-key
```

Parameters: None (uses API key from header)

Response:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "scopes": ["zkp:verify", "sbt:read"],
    "name": "API Key Name"
  }
}
```

### Check API Status

```
GET /api/external/status
```

Parameters: None (uses API key from header)

Response:
```json
{
  "success": true,
  "data": {
    "status": "online",
    "version": "1.0.0"
  }
}
```

### Verify Reputation Proof

```
POST /api/external/zkp/verify-reputation
```

Parameters:
```json
{
  "proof": "zkp-proof-data-here",
  "threshold": 10
}
```

Response:
```json
{
  "success": true,
  "data": {
    "verified": true,
    "scoreRange": "10+",
    "verifiedAt": "2025-05-22T07:30:00Z",
    "category": "general"
  }
}
```

### Get SBT Metadata

```
GET /api/external/sbt/metadata/:tokenId
```

Parameters: Token ID in the URL path

Response:
```json
{
  "success": true,
  "data": {
    "tokenId": "123",
    "name": "HyperDAG SBT #123",
    "description": "A Soulbound Token representing verified credentials and reputation on the HyperDAG platform",
    "image": "https://api.hyperdag.org/sbt/image/123",
    "attributes": [
      {
        "trait_type": "Reputation Score",
        "value": "Verified",
        "display_type": "zkp"
      },
      {
        "trait_type": "Type",
        "value": "Community Member"
      },
      {
        "trait_type": "Issued Date",
        "value": "2025-05-22",
        "display_type": "date"
      }
    ]
  }
}
```

### Verify SBT Ownership

```
POST /api/external/sbt/verify-ownership
```

Parameters:
```json
{
  "tokenId": "123",
  "proof": "ownership-proof-data-here"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "verified": true,
    "tokenType": "SBT",
    "verificationTime": "2025-05-22T07:30:00Z"
  }
}
```

## Example Implementation

Here's a basic JavaScript implementation for verifying reputation using our API:

```javascript
async function verifyReputationWithHyperDAG(proof, threshold = 10) {
  try {
    const response = await fetch('https://api.hyperdag.org/api/external/zkp/verify-reputation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your-api-key-here'
      },
      body: JSON.stringify({
        proof,
        threshold
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Verification failed');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error verifying reputation with HyperDAG:', error);
    throw error;
  }
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad request (missing parameters)
- 401: Unauthorized (invalid API key)
- 403: Forbidden (insufficient permissions)
- 404: Resource not found
- 500: Server error

## Getting Help

If you need assistance, please reach out to our team at dev-support@hyperdag.org