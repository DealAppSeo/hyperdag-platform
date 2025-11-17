import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "hyperdag-landing-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Early Access API - Only route needed for landing page
import earlyAccessRouter from './api/routes/early-access.js';
app.use('/api/early-access', earlyAccessRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const port = parseInt(process.env.PORT || "5000", 10);

const frontendFiles = process.cwd() + "/dist";
app.use(express.static(frontendFiles));
app.get("/*", (_, res) => {
  res.sendFile(frontendFiles + "/index.html");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Minimal HyperDAG server running on port ${port}`);
});
