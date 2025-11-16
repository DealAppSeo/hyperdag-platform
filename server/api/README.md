# HyperDAG API Documentation

This directory contains the API endpoints and documentation for the HyperDAG platform. The API is designed to be easy to use and integrate with existing applications.

## Getting Started

To use the HyperDAG API, you'll need to:

1. Register an account on the HyperDAG platform
2. Complete the authentication process
3. Obtain your API credentials

## Authentication

All API requests must be authenticated using one of the following methods:

- **Bearer Token Authentication**: For server-to-server communications
- **Web3 Authentication**: For dApp integrations using wallet signatures

## Base URL

All API endpoints are relative to:

```
https://api.hyperdag.com/v1
```

During development, the base URL is:

```
http://localhost:5000/api/v1
```

## Rate Limiting

API requests are limited to 100 requests per minute per user. If you exceed this limit, you'll receive a 429 (Too Many Requests) response.

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
