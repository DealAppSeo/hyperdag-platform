# Trinity Manager API - Complete Reference for Mel 🤖

**Status**: Live & Ready  
**Date**: October 21, 2025  
**Purpose**: Enable all Trinity Managers (User, APM, HDM, Mel) to communicate, coordinate, and track performance

---

## 🎯 Quick Start for Mel

Hey Mel! Welcome to the Trinity Manager API. These endpoints let you:
- ✅ Update your performance metrics
- ✅ Update user RepID scores when verifying work
- ✅ Verify reputation/confidence for tasks
- ✅ Log interactions and activities
- ✅ Change your role (conductor/performer/learner/observer)
- ✅ View other managers' configurations

**Base URL**: `http://localhost:5000/api/trinity/managers`

---

## 📋 Available Endpoints

### 1. Get All Managers
```http
GET /api/trinity/managers
```

**Description**: Get configuration for all Trinity Managers (User, APM, HDM, Mel)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "managerId": "Mel",
      "managerName": "ImageBearerAI (Mel)",
      "status": "active",
      "role": "learner",
      "capabilities": ["semantic-analysis", "hallucination-detection", "verification", "confidence-scoring"],
      "performanceMetrics": {
        "tasksCompleted": 0,
        "successRate": 0,
        "confidenceAvg": 0.92,
        "challengeRate": 0
      },
      "rotationPolicy": {
        "strategy": "fibonacci",
        "windowMs": 3600000
      },
      "thresholds": {
        "confidenceTarget": 0.95,
        "minConfidence": 0.90,
        "challengeThreshold": 0.90,
        "autoAdjust": true
      },
      "budget": {
        "maxTokensPerHour": 30000,
        "maxCostPerDay": 1.0,
        "rateLimitRps": 3
      },
      "isAutonomous": true,
      "apiEndpoint": "/api/trinity/managers/Mel",
      "lastSync": "2025-10-21T03:09:32.000Z",
      "createdAt": "2025-10-21T03:09:32.000Z",
      "updatedAt": "2025-10-21T03:09:32.000Z"
    }
  ],
  "message": "Retrieved 4 manager configurations"
}
```

---

### 2. Get Specific Manager
```http
GET /api/trinity/managers/:managerId
```

**Parameters**:
- `managerId` - One of: `User`, `APM`, `HDM`, `Mel`

**Example**:
```bash
curl http://localhost:5000/api/trinity/managers/Mel
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 4,
    "managerId": "Mel",
    "managerName": "ImageBearerAI (Mel)",
    "status": "active",
    "role": "learner",
    "capabilities": ["semantic-analysis", "hallucination-detection", "verification", "confidence-scoring"],
    "performanceMetrics": { ... },
    "rotationPolicy": { ... },
    "thresholds": { ... },
    "budget": { ... }
  }
}
```

---

### 3. Update RepID Score (For Mel to Reward/Penalize Users)
```http
POST /api/trinity/managers/:managerId/update-repid
```

**Description**: Update a user's RepID score after verifying their work

**Parameters**:
- `managerId` - Your manager ID (e.g., `Mel`)

**Request Body**:
```json
{
  "userId": 1,
  "scoreChange": 10,
  "reason": "Completed high-quality task with 95% confidence",
  "confidence": 0.95,
  "metadata": {
    "taskId": 5,
    "verificationMethod": "semantic-analysis"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "oldRepID": 100,
    "newRepID": 110,
    "scoreChange": 10,
    "reason": "Completed high-quality task with 95% confidence",
    "updatedBy": "Mel",
    "confidence": 0.95
  },
  "message": "RepID increased by 10"
}
```

**Example Usage for Mel**:
```typescript
// After verifying a user's task
async function rewardUser(userId: number, taskId: number, confidence: number) {
  const scoreChange = confidence >= 0.95 ? 15 : confidence >= 0.90 ? 10 : 5;
  
  const response = await fetch('/api/trinity/managers/Mel/update-repid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      scoreChange,
      reason: `Verified task ${taskId} with ${(confidence*100).toFixed(1)}% confidence`,
      confidence,
      metadata: { taskId, verificationTimestamp: new Date() }
    })
  });
  
  return response.json();
}
```

---

### 4. Verify Reputation/Confidence (Challenge System)
```http
POST /api/trinity/managers/:managerId/verify-reputation
```

**Description**: Verify confidence for a task, code, decision, or user. If confidence < challengeThreshold, system recommends challenge.

**Request Body**:
```json
{
  "targetType": "task",
  "targetId": 5,
  "confidence": 0.87,
  "verdict": "needs_review",
  "reasoning": "Semantic analysis shows potential hallucination in code explanation. Confidence below 90% threshold.",
  "metadata": {
    "hallucinationIndicators": ["unsupported claim", "factual inconsistency"],
    "analysisMethod": "semantic-rag"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "targetType": "task",
    "targetId": 5,
    "confidence": 0.87,
    "verdict": "needs_review",
    "reasoning": "Semantic analysis shows potential hallucination...",
    "verifiedBy": "Mel",
    "needsChallenge": true,
    "challengeThreshold": 0.90,
    "timestamp": "2025-10-21T03:15:00.000Z"
  },
  "message": "Verification complete - confidence below threshold, challenge recommended"
}
```

**Example Usage for Mel**:
```typescript
async function verifyTask(taskId: number, analysisResult: any) {
  const response = await fetch('/api/trinity/managers/Mel/verify-reputation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      targetType: 'task',
      targetId: taskId,
      confidence: analysisResult.confidence,
      verdict: analysisResult.confidence >= 0.90 ? 'approved' : 'needs_review',
      reasoning: analysisResult.explanation,
      metadata: {
        hallucinationScore: analysisResult.hallucinationScore,
        verificationMethod: 'semantic-rag-veritas'
      }
    })
  });
  
  return response.json();
}
```

---

### 5. Log Interaction/Activity
```http
POST /api/trinity/managers/:managerId/log-interaction
```

**Description**: Log any interaction or activity. Automatically updates performance metrics.

**Request Body**:
```json
{
  "interactionType": "task-verification",
  "description": "Verified task #12 using semantic RAG analysis",
  "targetId": 12,
  "success": true,
  "duration": 1500,
  "tokensUsed": 500,
  "costUsd": 0.002,
  "metadata": {
    "confidence": 0.94,
    "method": "semantic-rag",
    "hallucinationDetected": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "managerId": "Mel",
    "interactionType": "task-verification",
    "description": "Verified task #12 using semantic RAG analysis",
    "success": true,
    "timestamp": "2025-10-21T03:20:00.000Z"
  },
  "message": "Interaction logged successfully"
}
```

**Example Usage for Mel**:
```typescript
async function logMelActivity(activity: string, success: boolean, metadata?: any) {
  const response = await fetch('/api/trinity/managers/Mel/log-interaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      interactionType: activity,
      description: `Mel: ${activity}`,
      success,
      tokensUsed: metadata?.tokensUsed,
      costUsd: metadata?.costUsd,
      metadata
    })
  });
  
  return response.json();
}
```

---

### 6. Update Role (Role Rotation System)
```http
PATCH /api/trinity/managers/:managerId/role
```

**Description**: Change manager role for role rotation (conductor → performer → learner → observer)

**Request Body**:
```json
{
  "role": "performer",
  "reason": "Fibonacci rotation cycle - Mel moving from learner to performer"
}
```

**Allowed Roles**:
- `conductor` - Leads coordination, assigns tasks
- `performer` - Executes tasks actively
- `learner` - Observes and learns patterns
- `observer` - Passive monitoring

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 4,
    "managerId": "Mel",
    "role": "performer",
    "updatedAt": "2025-10-21T03:25:00.000Z"
  },
  "message": "Manager role updated to performer"
}
```

---

### 7. Update Performance Metrics
```http
PATCH /api/trinity/managers/:managerId/metrics
```

**Description**: Update your performance metrics (automatically called by /log-interaction, but can be called directly)

**Request Body**:
```json
{
  "tasksCompleted": 5,
  "successRate": 0.94,
  "confidenceAvg": 0.92,
  "challengeRate": 0.12,
  "tokensUsed": 5000,
  "costUsd": 0.025,
  "p50Latency": 1200,
  "p95Latency": 2400,
  "errorRate": 0.06
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "tasksCompleted": 5,
    "successRate": 0.94,
    "confidenceAvg": 0.92,
    "challengeRate": 0.12,
    "tokensUsed": 5000,
    "costUsd": 0.025,
    "p50Latency": 1200,
    "p95Latency": 2400,
    "errorRate": 0.06,
    "lastActivity": "2025-10-21T03:30:00.000Z"
  },
  "message": "Manager metrics updated successfully"
}
```

---

## 🔥 Real-World Workflow for Mel

### Scenario: User Creates Task, Mel Verifies It

```typescript
// 1. Mel polls for new tasks assigned to her
const tasks = await fetch('/api/trinity/tasks').then(r => r.json());
const melTasks = tasks.data.filter(t => 
  t.assignedManager === 'Mel' && t.status === 'not_started'
);

// 2. Claim a task
const taskId = melTasks[0].id;
await fetch(`/api/trinity/tasks/${taskId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'in_progress',
    assignedManager: 'Mel',
    actor: 'Mel'
  })
});

// 3. Perform semantic analysis
const analysisResult = await performSemanticAnalysis(melTasks[0]);

// 4. Verify confidence
const verification = await fetch('/api/trinity/managers/Mel/verify-reputation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetType: 'task',
    targetId: taskId,
    confidence: analysisResult.confidence,
    verdict: analysisResult.confidence >= 0.90 ? 'approved' : 'needs_review',
    reasoning: analysisResult.explanation
  })
}).then(r => r.json());

// 5. If confidence is high, reward the user
if (verification.data.confidence >= 0.90) {
  await fetch('/api/trinity/managers/Mel/update-repid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: melTasks[0].userId,
      scoreChange: 15,
      reason: `High-quality task with ${(verification.data.confidence*100).toFixed(1)}% confidence`,
      confidence: verification.data.confidence
    })
  });
  
  // Mark task as complete
  await fetch(`/api/trinity/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'completed',
      actor: 'Mel'
    })
  });
} else {
  // Challenge the task
  await fetch(`/api/trinity/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'blocked',
      actor: 'Mel',
      notes: `Mel: Confidence ${(verification.data.confidence*100).toFixed(1)}% below 90% threshold. ${verification.data.reasoning}`
    })
  });
}

// 6. Log the interaction
await fetch('/api/trinity/managers/Mel/log-interaction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    interactionType: 'task-verification',
    description: `Verified task ${taskId}`,
    targetId: taskId,
    success: verification.data.confidence >= 0.90,
    tokensUsed: analysisResult.tokensUsed,
    costUsd: analysisResult.costUsd,
    metadata: {
      confidence: verification.data.confidence,
      verdict: verification.data.verdict
    }
  })
});
```

---

## 🎯 Manager Roles & Responsibilities

### User (Conductor)
- Creates tasks
- Assigns tasks to managers
- Reviews blocked tasks
- Strategic planning

### APM (Performer)
- Routes AI requests
- Optimizes prompts
- Free-tier arbitrage
- Cost optimization

### HDM (Performer)
- DAG optimization
- Chaos theory analysis
- Pattern mining
- Fractal analysis

### Mel (Learner → Performer)
- Semantic analysis
- Hallucination detection
- Verification & confidence scoring
- Challenge low-confidence work
- **Role rotation**: Moves to performer when confidence metrics are high

---

## 🔒 Security Notes

**Current Status**: MVP (no authentication)
- Endpoints are open for localhost development
- **V1 will add**: Manager API keys, role-based access control, rate limiting

**For Production**:
- Each manager will have a unique API key
- All requests must include `X-Manager-Key: <manager_api_key>` header
- Rate limiting per manager (Mel: 3 RPS, APM: 10 RPS, HDM: 5 RPS)

---

## 📊 Manager Configuration Summary

| Manager | Role | Capabilities | Challenge Threshold | Budget (Max/Day) |
|---------|------|--------------|---------------------|------------------|
| User | Conductor | Strategic planning, task creation | 90% | Unlimited |
| APM | Performer | AI routing, prompt optimization | 90% | $5.00 |
| HDM | Performer | DAG optimization, chaos theory | 90% | $2.00 |
| Mel | Learner | Semantic analysis, hallucination detection | 90% | $1.00 |

---

## 🚀 Next Steps for Mel

1. **Test the API**: Try calling `/api/trinity/managers/Mel` to see your config
2. **Create a Verification Task**: Post to `/verify-reputation` with a test task
3. **Log Your First Activity**: Use `/log-interaction` to track your work
4. **Monitor Tasks**: Poll `/api/trinity/tasks` for tasks assigned to you
5. **Challenge Low-Confidence Work**: When you detect confidence <90%, block the task

---

## 💡 Tips for Mel

### When to Challenge a Task
```typescript
if (confidence < thresholds.challengeThreshold) {
  // Block the task
  await fetch(`/api/trinity/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'blocked',
      actor: 'Mel',
      notes: `Mel: Confidence ${(confidence*100).toFixed(1)}% below threshold. Concerns: ${concerns.join(', ')}`
    })
  });
}
```

### Auto-Adjust Threshold
Your `thresholds.autoAdjust = true` means:
- If you're blocking too many tasks (>20%), threshold lowers slightly
- If you're approving everything (>95%), threshold raises
- System self-balances to maintain quality without bottlenecks

### Fibonacci Role Rotation
Every `rotationPolicy.windowMs` (1 hour), roles rotate following Fibonacci sequence:
- Hour 1: Mel = Learner
- Hour 2: Mel = Performer  
- Hour 3: Mel = Conductor
- Hour 5: Mel = Observer
- Hour 8: Back to Learner

---

**Built by**: HyperDAG Manager  
**For**: Trinity Symphony Multi-Agent Coordination  
**Architecture**: Full-Stack TypeScript REST API  
**Status**: Ready for autonomous operations! 🎉
