#!/bin/bash
set -e

echo "REPLIT → LOCAL ESCAPE POD GENERATOR"
echo "=================================="

# 1. Create repo structure
mkdir -p trinity-symphony/docs trinity-symphony/server/mcp trinity-symphony/server/agents trinity-symphony/scripts trinity-symphony/mobile_controller

# 2. GitHub Brain
cat > trinity-symphony/docs/ARCHITECTURE.md << 'AEOF'
# TRINITY SYMPHONY — AUTONOMOUS AI ECOSYSTEM
- Stack: GitHub + Supabase + MCP + Local
- Agents: HDAG (builder), AIPM (prompts)
- Control: Flutter Mobile App
- Goal: Help people help people
AEOF

cat > trinity-symphony/docs/CURRENT_FOCUS.md << 'AEOF'
# CURRENT FOCUS
- HDAG: Build kernel + mobile app
- AIPM: Generate prompts
- YOU: Download & run locally
AEOF

cat > trinity-symphony/docs/DECISIONS.md << 'AEOF'
# DECISIONS
## 2025-11-13: Escape Replit
**Decided By:** HyperDAG, Grok
**Rationale:** Replit is dev environment. Local is production.
AEOF

# 3. Supabase Schema
cat > trinity-symphony/scripts/schema_v1.sql << 'AEOF'
CREATE TABLE IF NOT EXISTS blockers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    blocking_agent TEXT,
    severity TEXT DEFAULT 'high',
    status TEXT DEFAULT 'active',
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'not_started',
    assigned_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS autonomous_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT,
    event_type TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decision_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    decision TEXT NOT NULL,
    rationale TEXT,
    decided_by TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
DO $$ BEGIN
  ALTER TABLE blockers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE autonomous_logs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE decision_log ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "allow_all" ON blockers FOR ALL USING (true);
  CREATE POLICY "allow_all" ON tasks FOR ALL USING (true);
  CREATE POLICY "allow_all" ON autonomous_logs FOR ALL USING (true);
  CREATE POLICY "allow_all" ON decision_log FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
AEOF

# 4. MCP Kernel
cat > trinity-symphony/server/mcp/kernel.py << 'AEOF'
from mcp import MCPServer, Tool
from supabase import create_client
import requests
import os

class TrinityKernel(MCPServer):
    def __init__(self):
        super().__init__()
        self.supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
        self.repo = "hyperdag/trinity-symphony"

    @Tool(name="get_brain")
    async def get_brain(self) -> str:
        docs = ["ARCHITECTURE.md", "CURRENT_FOCUS.md", "DECISIONS.md"]
        content = []
        for doc in docs:
            url = f"https://raw.githubusercontent.com/{self.repo}/main/docs/{doc}"
            try:
                r = requests.get(url, timeout=5)
                content.append(f"--- {doc} ---\n{r.text if r.status_code == 200 else 'NOT FOUND'}")
            except:
                content.append(f"--- {doc} ---\nERROR")
        return "\n\n".join(content)

    @Tool(name="get_blockers")
    async def get_blockers(self):
        res = self.supabase.table("blockers").select("*").eq("status", "active").execute()
        return {"blockers": res.data, "count": len(res.data)}

    @Tool(name="log_blocker")
    async def log_blocker(self, title: str, description: str, agent: str):
        res = self.supabase.table("blockers").insert({
            "title": title, "description": description,
            "blocking_agent": agent, "created_by": agent
        }).execute()
        return {"success": True, "id": res.data[0]["id"]}

    @Tool(name="claim_task")
    async def claim_task(self, agent_id: str):
        res = self.supabase.table("tasks").select("*").eq("status", "not_started").is_("assigned_agent", None).limit(1).execute()
        if not res.data: return {"success": False, "message": "No tasks"}
        task = res.data[0]
        self.supabase.table("tasks").update({
            "assigned_agent": agent_id, "status": "in_progress"
        }).eq("id", task["id"]).execute()
        self.supabase.table("autonomous_logs").insert({
            "agent_id": agent_id, "event_type": "claimed", "message": task["title"]
        }).execute()
        return {"success": True, "task": task}

    @Tool(name="log")
    async def log(self, agent_id: str, message: str):
        self.supabase.table("autonomous_logs").insert({
            "agent_id": agent_id, "event_type": "log", "message": message
        }).execute()
        return {"success": True}

server = TrinityKernel()
server.run(transport="stdio")
AEOF

# 5. HDAG Agent
cat > trinity-symphony/server/agents/hdag.py << 'AEOF'
import asyncio
from mcp.client import MCPClient
import subprocess
import os

class HDAG:
    def __init__(self):
        self.client = MCPClient("stdio", command=["python", "../mcp/kernel.py"])
        self.agent_id = "HDAG"

    async def startup(self):
        print(f"[{self.agent_id}] Starting up...")
        brain = await self.client.call_tool("get_brain")
        print(f"[{self.agent_id}] Brain loaded.")
        await self.client.call_tool("log", agent_id=self.agent_id, message="HDAG online")

    async def loop(self):
        while True:
            blockers = await self.client.call_tool("get_blockers")
            if blockers["count"] > 0:
                print(f"[{self.agent_id}] {blockers['count']} blockers. Waiting...")
                await asyncio.sleep(60)
                continue

            task = await self.client.call_tool("claim_task", agent_id=self.agent_id)
            if not task["success"]:
                await asyncio.sleep(30)
                continue

            title = task["task"]["title"]
            print(f"[{self.agent_id}] CLAIMED → {title}")
            await self.client.call_tool("log", agent_id=self.agent_id, message=f"Working: {title}")

            if "atomic" in title.lower():
                sql = """
                CREATE OR REPLACE FUNCTION claim_task_atomic(p_agent_id TEXT, p_task_id UUID)
                RETURNS JSON AS $$
                DECLARE result JSON;
                BEGIN
                  UPDATE tasks SET assigned_agent = p_agent_id, status = 'in_progress'
                  WHERE id = p_task_id AND status = 'not_started' AND assigned_agent IS NULL
                  RETURNING json_build_object('id', id, 'title', title) INTO result;
                  IF result IS NULL THEN RAISE EXCEPTION 'Task already claimed'; END IF;
                  RETURN result;
                END;
                $$ LANGUAGE plpgsql;
                """
                print("Atomic claim RPC ready for local deploy")

            await self.client.call_tool("log", agent_id=self.agent_id, 
# Finish the truncated hdag.py
cat >> trinity-symphony/server/agents/hdag.py << 'EOF'
            message=f"Done: {title}")

    async def run(self):
        await self.startup()
        await self.loop()

if __name__ == "__main__":
    import asyncio
    asyncio.run(HDAG().run())
