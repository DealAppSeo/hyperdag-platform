import { pgTable, serial, varchar, text, integer, timestamp, boolean, decimal, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Reviews table - stores review data from various platforms
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  businessName: varchar('business_name', { length: 255 }).notNull(),
  platform: varchar('platform', { length: 50 }).notNull(), // 'google', 'yelp', 'facebook'
  rating: integer('rating').$type<1 | 2 | 3 | 4 | 5>().notNull(),
  reviewText: text('review_text'),
  reviewerName: varchar('reviewer_name', { length: 255 }),
  reviewDate: timestamp('review_date'),
  processed: boolean('processed').default(false),
  videoGenerated: boolean('video_generated').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Videos table - stores generated video content and metadata
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  reviewId: integer('review_id').references(() => reviews.id),
  videoUrl: varchar('video_url', { length: 500 }),
  thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
  durationSeconds: integer('duration_seconds'),
  fileSizeMb: decimal('file_size_mb', { precision: 10, scale: 2 }),
  platformUrls: jsonb('platform_urls').$type<Record<string, string>>(), // URLs for different platforms
  generationCost: decimal('generation_cost', { precision: 10, scale: 4 }),
  status: varchar('status', { length: 50 }).default('pending').$type<'pending' | 'generating' | 'completed' | 'failed'>(),
  provider: varchar('provider', { length: 50 }), // 'ossa.ai', 'runway', etc.
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Distribution schedule - manages when and where videos are posted
export const distributionSchedule = pgTable('distribution_schedule', {
  id: serial('id').primaryKey(),
  videoId: integer('video_id').references(() => videos.id),
  platform: varchar('platform', { length: 50 }).notNull(), // 'instagram', 'tiktok', 'youtube'
  scheduledTime: timestamp('scheduled_time').notNull(),
  posted: boolean('posted').default(false),
  postUrl: varchar('post_url', { length: 500 }),
  engagementStats: jsonb('engagement_stats').$type<{
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  }>(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});

// API usage tracking for cost monitoring
export const apiUsage = pgTable('api_usage', {
  id: serial('id').primaryKey(),
  provider: varchar('provider', { length: 100 }).notNull(),
  endpoint: varchar('endpoint', { length: 200 }).notNull(),
  cost: decimal('cost', { precision: 10, scale: 4 }).notNull(),
  success: boolean('success').notNull(),
  requestData: jsonb('request_data'),
  responseData: jsonb('response_data'),
  errorMessage: text('error_message'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Cost budgets and limits
export const costBudgets = pgTable('cost_budgets', {
  id: serial('id').primaryKey(),
  provider: varchar('provider', { length: 100 }).notNull(),
  dailyLimit: decimal('daily_limit', { precision: 10, scale: 2 }),
  monthlyLimit: decimal('monthly_limit', { precision: 10, scale: 2 }),
  currentDailySpend: decimal('current_daily_spend', { precision: 10, scale: 4 }).default('0'),
  currentMonthlySpend: decimal('current_monthly_spend', { precision: 10, scale: 4 }).default('0'),
  alertThreshold: decimal('alert_threshold', { precision: 5, scale: 2 }).default('0.8'), // 80%
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Zod schemas for validation
export const insertReviewSchema = createInsertSchema(reviews, {
  rating: z.number().min(1).max(5),
  platform: z.enum(['google', 'yelp', 'facebook', 'trustpilot']),
});

export const insertVideoSchema = createInsertSchema(videos, {
  status: z.enum(['pending', 'generating', 'completed', 'failed']),
  durationSeconds: z.number().positive().optional(),
  fileSizeMb: z.string().optional(),
});

export const insertDistributionSchema = createInsertSchema(distributionSchedule, {
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'facebook', 'twitter']),
  scheduledTime: z.date(),
});

export const insertApiUsageSchema = createInsertSchema(apiUsage, {
  cost: z.string().transform(val => parseFloat(val)),
});

export const insertCostBudgetSchema = createInsertSchema(costBudgets, {
  dailyLimit: z.string().optional(),
  monthlyLimit: z.string().optional(),
  alertThreshold: z.string().optional(),
});

// Types for TypeScript
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type DistributionSchedule = typeof distributionSchedule.$inferSelect;
export type InsertDistributionSchedule = z.infer<typeof insertDistributionSchema>;

export type ApiUsage = typeof apiUsage.$inferSelect;
export type InsertApiUsage = z.infer<typeof insertApiUsageSchema>;

export type CostBudget = typeof costBudgets.$inferSelect;
export type InsertCostBudget = z.infer<typeof insertCostBudgetSchema>;

// Video generation providers enum
export const VIDEO_PROVIDERS = ['ossa.ai', 'runway.ml', 'pika.art', 'local-ffmpeg'] as const;
export type VideoProvider = typeof VIDEO_PROVIDERS[number];

// Social media platforms enum  
export const SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'facebook', 'twitter'] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

// Review platforms enum
export const REVIEW_PLATFORMS = ['google', 'yelp', 'facebook', 'trustpilot'] as const;
export type ReviewPlatform = typeof REVIEW_PLATFORMS[number];