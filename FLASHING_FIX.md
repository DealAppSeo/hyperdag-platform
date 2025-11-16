# Page Flashing Fix Guide

## Problem Identified

The page flashing on desktop and mobile (both preview and production) is caused by **Vite HMR (Hot Module Replacement) constant reconnections**.

### Root Causes

1. **server/vite.ts Line 59** (CANNOT AUTO-FIX - Protected File):
   ```typescript
   template = template.replace(
     `src="/src/main.tsx"`,
     `src="/src/main.tsx?v=${nanoid()}"`,
   );
   ```
   This adds a random version to EVERY HTML request, forcing browser to reload constantly.

2. **ErrorBoundary Auto-Retry Loop** ✅ FIXED:
   - Removed `setTimeout(resetErrorBoundary, 1000)` infinite retry
   - Changed to manual reload button

3. **React StrictMode** ✅ FIXED:
   - Removed StrictMode wrapper causing double renders

---

## What Was Fixed Automatically

✅ **Removed infinite retry loop** in `client/src/App.tsx`
- Before: Auto-retried every 1 second on module errors
- After: Shows manual reload button

✅ **Removed React StrictMode** in `client/src/main.tsx`
- Prevents double renders in development

---

## Manual Fix Required

### Option 1: Modify server/vite.ts (Recommended)

**File**: `server/vite.ts`  
**Lines 55-61**: Remove the nanoid() cache busting

**Current Code**:
```typescript
// always reload the index.html file from disk incase it changes
let template = await fs.promises.readFile(clientTemplate, "utf-8");
template = template.replace(
  `src="/src/main.tsx"`,
  `src="/src/main.tsx?v=${nanoid()}"`,
);
const page = await vite.transformIndexHtml(url, template);
```

**Change To**:
```typescript
// always reload the index.html file from disk incase it changes
let template = await fs.promises.readFile(clientTemplate, "utf-8");
const page = await vite.transformIndexHtml(url, template);
```

Simply delete lines 57-60 (the template.replace block).

### Option 2: Deploy to Production (HMR Disabled)

In production builds, Vite HMR is automatically disabled. The flashing only happens in development mode.

To deploy:
1. Fix the `.replit` file (remove extra port configs)
2. Run deployment
3. Production build won't have HMR reconnections

---

## Browser Console Evidence

**Before Fix**:
```
[vite] connecting...
[vite] server connection lost. Polling for restart...
[vite] connecting...
[vite] server connection lost. Polling for restart...
```
(Repeats constantly, causing flashing)

**Expected After Full Fix**:
```
[vite] connected.
```
(Stable connection, no flashing)

---

## Testing the Fix

After modifying `server/vite.ts`:

1. Save the file
2. Server will auto-restart
3. Refresh browser
4. Page should load without flashing
5. Check browser console - should see stable "[vite] connected."

---

## Why This Matters

- **Development**: Constant reconnections make the app unusable
- **Production**: Shouldn't have HMR at all (disabled in build)
- **User Experience**: Flashing creates poor first impression

---

## Summary

**Auto-Fixed** ✅:
- Infinite retry loop removed
- StrictMode removed
- Error handling improved

**Manual Fix Needed** ⚠️:
- Edit `server/vite.ts` to remove nanoid() cache busting (3 lines)

**Alternative** 🚀:
- Deploy to production where HMR is disabled by default

---

Generated: 2025-11-05
