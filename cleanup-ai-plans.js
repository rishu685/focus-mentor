#!/usr/bin/env node

// Emergency script to clean up AI plans with React content
import mongoose from 'mongoose';
import StudyPlan from './server/models/studyPlan.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanupAIPlans() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/focus-mentor');
    console.log('Connected to MongoDB');

    // Delete all plans with React content
    const deleteResult = await StudyPlan.deleteMany({ 
      $or: [
        { 'weeklyPlans.goals': { $regex: /react|jsx|component|hook|props|state/i } },
        { 'weeklyPlans.dailyTasks.tasks': { $regex: /react|jsx|component|hook|props|state/i } },
        { 'recommendations': { $regex: /react|jsx|component|hook|props|state/i } }
      ]
    });
    
    console.log(`🗑️  Cleaned up ${deleteResult.deletedCount} plans with React content`);
    
    // Also clean up AI plans that might have wrong content
    const aiDeleteResult = await StudyPlan.deleteMany({
      'overview.subject': { $regex: /ai|artificial intelligence|machine learning|generative ai/i }
    });
    
    console.log(`🧠 Deleted ${aiDeleteResult.deletedCount} AI-related plans to force regeneration`);
    
    console.log('✅ Database cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up plans:', error);
    process.exit(1);
  }
}

cleanupAIPlans();