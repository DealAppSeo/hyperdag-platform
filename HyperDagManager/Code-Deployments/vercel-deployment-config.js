// Vercel Deployment Configuration for HyperDAG Platform
// FREE TIER DEPLOYMENT - Zero Cost Implementation

module.exports = {
  // Project Configuration
  name: "hyperdag-platform",
  version: 2,
  
  // Build Configuration
  builds: [
    {
      src: "client/**/*",
      use: "@vercel/static-build",
      config: {
        distDir: "dist"
      }
    },
    {
      src: "server/**/*.js",
      use: "@vercel/node"
    }
  ],
  
  // Routes Configuration
  routes: [
    // Static assets
    {
      src: "/assets/(.*)",
      dest: "/client/dist/assets/$1"
    },
    // API routes
    {
      src: "/api/(.*)",
      dest: "/server/routes.js"
    },
    // SPA fallback
    {
      src: "/(.*)",
      dest: "/client/dist/index.html"
    }
  ],
  
  // Environment Variables (Free Tier)
  env: {
    NODE_ENV: "production",
    DATABASE_URL: "@database_url",
    VITE_API_URL: "https://hyperdag-platform.vercel.app/api"
  },
  
  // Functions Configuration
  functions: {
    "server/**/*.js": {
      runtime: "nodejs18.x",
      memory: 1024
    }
  },
  
  // Free Tier Optimizations
  github: {
    enabled: true,
    autoJobCancelation: true
  },
  
  // Performance Settings
  headers: [
    {
      source: "/api/(.*)",
      headers: [
        {
          key: "Cache-Control",
          value: "s-maxage=86400"
        }
      ]
    },
    {
      source: "/assets/(.*)",
      headers: [
        {
          key: "Cache-Control", 
          value: "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  
  // Redirects for SEO
  redirects: [
    {
      source: "/dashboard",
      destination: "/",
      permanent: false
    }
  ],
  
  // Regions (Free tier defaults)
  regions: ["iad1"],
  
  // Analytics (Free tier)
  analytics: {
    id: "hyperdag-platform"
  }
};

// Deployment Notes:
// 1. Uses Vercel free tier (100GB bandwidth/month)
// 2. Serverless functions (125k invocations/month)
// 3. Automatic SSL certificates
// 4. Git integration for CI/CD
// 5. Preview deployments for testing

// Commands for deployment:
// npm install -g vercel
// vercel login
// vercel --prod
// vercel alias set hyperdag-platform.vercel.app hyperdag.app (custom domain)