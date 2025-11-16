# BLOAT PURGE LIST
## Services Causing Server Overload & Screen Flashing

### CRITICAL OFFENDERS (Running every 2-30 seconds)
1. **AI-Prompt-Manager ANFIS** - Syncing metrics constantly
2. **SynapticFlow-Manager** - Cross-manager sync every 30s
3. **Temporal Arbitrage Engine** - Pricing pattern updates
4. **Self-Improvement Service** - Continuous performance analysis
5. **Resource Arbitrage Engine** - Comprehensive opportunity scans
6. **Social Problem Solver** - Game engine arbitrage simulations
7. **Educational Arbitrage** - Google Colab task simulations

### MODERATE OFFENDERS (Running every 1-5 minutes)
8. **Problem Detector** - Detection cycles every 5min (KEEP but optimize)
9. **Real Metrics Collector** - Collection every 1min (KEEP but slow to 5min)
10. **HDM Consumer Loop** - Task polling every 5min (KEEP)

### FILES TO MODIFY
- `server/services/ai/synapticflow-manager-service.ts` - Line 586 (60s sync)
- `server/services/ai/synapticflow-manager-service.ts` - Line 943 (30s neuroplasticity)
- `server/services/ai/synapticflow-manager-service.ts` - Line 948 (60s memory)
- `server/services/optimization/recursive-self-improvement.ts` - setInterval loops
- `server/services/temporal-arbitrage-engine.ts` - setInterval loops
- `server/services/resource-arbitrage-engine.ts` - setInterval loops

### RECOMMENDED ACTION
**Option 1:** Disable non-critical background services entirely (clean)
**Option 2:** Increase all intervals from seconds → minutes (moderate)
**Option 3:** Comment out auto-start in server/index.ts (quick)
