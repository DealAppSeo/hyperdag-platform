import { Router, Request, Response } from "express";
import { storage } from "../../storage";
import { db } from "../../db";
import { sql } from "drizzle-orm";
import { PHILOMATH_TOPICS } from "../../../client/src/hooks/use-philomath";

const router = Router();

// Helper function for consistent API responses
function apiResponse(success: boolean, data?: any, message?: string) {
  return {
    success,
    data,
    message,
  };
}

// Middleware to require authentication
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json(apiResponse(false, null, "Authentication required"));
  }
  next();
}

// Get all topics
router.get("/topics", async (req: Request, res: Response) => {
  try {
    // For now, we'll use the static topics defined in the client
    // In a production environment, these would come from a database
    const topics = PHILOMATH_TOPICS.map(topic => ({
      id: topic.id,
      title: topic.title,
      category: topic.category,
      level: topic.level,
      // Don't send content - it will be fetched separately when needed
    }));
    
    return res.json(apiResponse(true, topics));
  } catch (error) {
    console.error("Error fetching topics:", error);
    return res.status(500).json(apiResponse(false, null, "Error fetching topics"));
  }
});

// Get specific topic content
router.get("/topics/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = PHILOMATH_TOPICS.find(t => t.id === id);
    
    if (!topic) {
      return res.status(404).json(apiResponse(false, null, "Topic not found"));
    }
    
    return res.json(apiResponse(true, topic));
  } catch (error) {
    console.error("Error fetching topic:", error);
    return res.status(500).json(apiResponse(false, null, "Error fetching topic"));
  }
});

// Get user progress data
router.get("/user/progress", requireAuth, async (req: Request, res: Response) => {
  try {
    // Fetch user's philomath data from the database
    // Currently these are stored in the user's session for simplicity
    // In a production version, this would be stored in a database
    const viewedTopics = req.session.viewed || [];
    const completedTopics = req.session.completed || [];
    const bookmarkedTopics = req.session.bookmarked || [];
    const disabled = req.session.philomathDisabled || false;
    
    return res.json(apiResponse(true, {
      viewed: viewedTopics,
      completed: completedTopics,
      bookmarked: bookmarkedTopics,
      disabled,
    }));
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return res.status(500).json(apiResponse(false, null, "Error fetching user progress"));
  }
});

// Toggle learning mode
router.post("/user/toggle", requireAuth, async (req: Request, res: Response) => {
  try {
    const { disabled } = req.body;
    
    // Update the user's preference in the session
    req.session.philomathDisabled = !disabled;
    
    // Save session
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    return res.json(apiResponse(true, { disabled: !disabled }));
  } catch (error) {
    console.error("Error toggling learning mode:", error);
    return res.status(500).json(apiResponse(false, null, "Error toggling learning mode"));
  }
});

// Mark topic as viewed
router.post("/user/viewed", requireAuth, async (req: Request, res: Response) => {
  try {
    const { topicId } = req.body;
    
    if (!topicId) {
      return res.status(400).json(apiResponse(false, null, "Topic ID is required"));
    }
    
    // Initialize viewed topics array if it doesn't exist
    if (!req.session.viewed) {
      req.session.viewed = [];
    }
    
    // Add topic to viewed array if it's not already there
    if (!req.session.viewed.includes(topicId)) {
      req.session.viewed.push(topicId);
    }
    
    // Save session
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    return res.json(apiResponse(true, { topicId }));
  } catch (error) {
    console.error("Error marking topic as viewed:", error);
    return res.status(500).json(apiResponse(false, null, "Error marking topic as viewed"));
  }
});

// Mark topic as completed
router.post("/user/completed", requireAuth, async (req: Request, res: Response) => {
  try {
    const { topicId } = req.body;
    
    if (!topicId) {
      return res.status(400).json(apiResponse(false, null, "Topic ID is required"));
    }
    
    // Initialize completed topics array if it doesn't exist
    if (!req.session.completed) {
      req.session.completed = [];
    }
    
    // Add topic to completed array if it's not already there
    if (!req.session.completed.includes(topicId)) {
      req.session.completed.push(topicId);
      
      // Ensure it's also in the viewed list
      if (!req.session.viewed) {
        req.session.viewed = [];
      }
      if (!req.session.viewed.includes(topicId)) {
        req.session.viewed.push(topicId);
      }
      
      // In a real implementation, we would also award reputation points here
      // This is where integration with the reputation system would happen
      if (req.user) {
        try {
          // Award reputation points for completing a topic
          // Award more points for intermediate and advanced topics
          const topic = PHILOMATH_TOPICS.find(t => t.id === topicId);
          let points = 5; // Default for beginner topics
          
          if (topic) {
            if (topic.level === "intermediate") {
              points = 10;
            } else if (topic.level === "advanced") {
              points = 15;
            }
          }
          
          await storage.updateUserPoints(req.user.id, points);
        } catch (error) {
          console.error("Error awarding reputation points:", error);
          // Continue even if awarding points fails
        }
      }
    }
    
    // Save session
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    return res.json(apiResponse(true, { topicId }));
  } catch (error) {
    console.error("Error marking topic as completed:", error);
    return res.status(500).json(apiResponse(false, null, "Error marking topic as completed"));
  }
});

// Toggle topic bookmark
router.post("/user/bookmark", requireAuth, async (req: Request, res: Response) => {
  try {
    const { topicId, bookmarked } = req.body;
    
    if (!topicId) {
      return res.status(400).json(apiResponse(false, null, "Topic ID is required"));
    }
    
    // Initialize bookmarked topics array if it doesn't exist
    if (!req.session.bookmarked) {
      req.session.bookmarked = [];
    }
    
    // Add or remove topic from bookmarked array
    const index = req.session.bookmarked.indexOf(topicId);
    
    if (bookmarked && index === -1) {
      // Add to bookmarks
      req.session.bookmarked.push(topicId);
    } else if (!bookmarked && index > -1) {
      // Remove from bookmarks
      req.session.bookmarked.splice(index, 1);
    }
    
    // Save session
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        resolve();
      });
    });
    
    return res.json(apiResponse(true, { 
      topicId,
      bookmarked: req.session.bookmarked.includes(topicId)
    }));
  } catch (error) {
    console.error("Error toggling topic bookmark:", error);
    return res.status(500).json(apiResponse(false, null, "Error toggling topic bookmark"));
  }
});

export default router;
