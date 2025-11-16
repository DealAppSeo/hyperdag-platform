# HyperDAG API Endpoints

This document describes the available API endpoints for the HyperDAG platform. All endpoints are relative to the base URL: `https://api.hyperdag.com/v1` (production) or `http://localhost:5000/api/v1` (development).

## Authentication

All API requests require authentication. You can authenticate using one of the following methods:

- **Bearer Token Authentication**: Include an API key in the `X-API-Key` header.
- **Web3 Authentication**: Include a `Authorization: Web3 {wallet_address}` header, where `{wallet_address}` is your Ethereum wallet address.

## Response Format

All responses are returned in JSON format with the following structure:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

Or in case of an error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

## Projects

### List Projects

**GET** `/projects`

Returns a list of all projects.

**Response:**

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": 1,
        "title": "Project Title",
        "description": "Project Description",
        "type": "rfp",
        "categories": ["dapp", "finance"],
        "creatorId": 123,
        "createdAt": "2025-05-01T12:00:00Z"
      }
    ]
  }
}
```

### Get Project

**GET** `/projects/{projectId}`

Returns details of a specific project.

**Response:**

```json
{
  "success": true,
  "data": {
    "project": {
      "id": 1,
      "title": "Project Title",
      "description": "Project Description",
      "type": "rfp",
      "categories": ["dapp", "finance"],
      "teamRoles": ["developer", "designer"],
      "fundingGoal": 1000,
      "durationDays": 30,
      "currentFunding": 500,
      "creatorId": 123,
      "createdAt": "2025-05-01T12:00:00Z"
    }
  }
}
```

### Create Project

**POST** `/projects`

Creates a new project.

**Request Body:**

```json
{
  "title": "New Project",
  "description": "Project Description",
  "type": "rfp",
  "categories": ["dapp", "finance"],
  "teamRoles": ["developer", "designer"],
  "fundingGoal": 1000,
  "durationDays": 30,
  "stakeTokens": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

### Match Teams

**GET** `/projects/{projectId}/teams/match`

Returns potential teams for a specific project.

**Response:**

```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "team-1",
        "members": [
          {
            "id": 1,
            "username": "dev1",
            "skills": ["javascript", "react", "blockchain"],
            "experience": 5,
            "persona": "developer",
            "reputation": 85
          },
          {
            "id": 2,
            "username": "designer1",
            "skills": ["ui", "ux", "figma"],
            "experience": 3,
            "persona": "designer",
            "reputation": 78
          }
        ],
        "matchScore": 0.87,
        "requiredRoles": ["developer", "designer", "marketer"],
        "completedRoles": ["developer", "designer"],
        "missingRoles": ["marketer"]
      }
    ]
  }
}
```

## Network

### Get Network Metrics

**GET** `/network/metrics`

Returns metrics about the HyperDAG network.

**Response:**

```json
{
  "success": true,
  "data": {
    "tps": 9876,
    "averageLatency": 138,
    "confirmedTxs": 24156789,
    "pendingTxs": 162,
    "activeNodes": 347
  }
}
```

## Transactions

### Submit Transaction

**POST** `/transactions`

Submits a transaction to the HyperDAG network.

**Request Body:**

```json
{
  "to": "0x1234...",
  "value": 10,
  "data": "0x..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "txHash": "0x1234..."
  }
}
```

## Tokens

### Get Token Balance

**GET** `/tokens/balance`

Returns the token balance for the authenticated user.

**Response:**

```json
{
  "success": true,
  "data": {
    "balance": 100
  }
}
```

## Error Codes

| Code | Description |
| ---- | ----------- |
| `UNAUTHORIZED` | Authentication required or invalid authentication credentials |
| `VALIDATION_ERROR` | Invalid request parameters |
| `NOT_FOUND` | Requested resource not found |
| `INSUFFICIENT_TOKENS` | Insufficient token balance for the requested operation |
| `SERVER_ERROR` | Internal server error |
