/**
 * Fixed Grant Sources and Grant Matches API Routes
 */

import { Request, Response, NextFunction } from 'express';
import { apiResponse } from '../index';
import { findAIEnhancedGrantMatches } from '../../services/grant-matching-service';
import { storage } from '../../storage';
import { 
  getAllGrantSources, 
  getActiveGrantSources, 
  getGrantSourceById,
  createGrantSource,
  getGrantCategories 
} from '../grant-api-fix';

// Get all grant sources
export async function getGrantSources(req: Request, res: Response) {
  try {
    // Get query parameters for filtering
    const category = req.query.category as string;
    const isActive = req.query.isActive === 'true';
    
    let sources;
    if (isActive) {
      sources = await getActiveGrantSources();
    } else {
      sources = await getAllGrantSources();
    }
    
    // Filter by category if provided
    if (category && sources.length > 0) {
      sources = sources.filter(source => 
        source.categories && source.categories.includes(category)
      );
    }
    
    return res.json(apiResponse(true, sources));
  } catch (error) {
    console.error('Error fetching grant sources:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to fetch grant sources'));
  }
}

// Get a single grant source by ID
export async function getGrantSourceById_Fixed(req: Request, res: Response) {
  try {
    const sourceId = parseInt(req.params.id);
    if (isNaN(sourceId)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid grant source ID'));
    }

    const source = await getGrantSourceById(sourceId);
    if (!source) {
      return res.status(404).json(apiResponse(false, null, 'Grant source not found'));
    }

    return res.json(apiResponse(true, source));
  } catch (error) {
    console.error('Error fetching grant source:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to fetch grant source'));
  }
}

// Create a new grant source
export async function createGrantSource_Fixed(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is an admin
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json(apiResponse(false, null, 'Only administrators can create grant sources'));
    }
    
    const { name, website, description, categories, availableFunds, applicationUrl, applicationDeadline, contactEmail } = req.body;
    
    // Basic validation
    if (!name || !website || !description) {
      return res.status(400).json(apiResponse(false, null, 'Missing required fields'));
    }

    const newSource = await createGrantSource({
      name,
      website,
      description,
      categories: categories || [],
      availableFunds: availableFunds ? parseInt(availableFunds) : null,
      applicationUrl,
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      contactEmail
    });

    return res.status(201).json(apiResponse(true, newSource));
  } catch (error) {
    console.error('Error creating grant source:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to create grant source'));
  }
}

// Get all available grant categories
export async function getGrantCategoriesList(req: Request, res: Response) {
  try {
    const categories = await getGrantCategories();
    return res.json(apiResponse(true, categories));
  } catch (error) {
    console.error('Error fetching grant categories:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to fetch grant categories'));
  }
}