import express from 'express';
import mongoose from 'mongoose';
import StudyPlan from '../models/studyPlan.js';
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    console.log('🧹 Starting AI study plans cleanup...');
    
    const reactTerms = [
      /jsx/i,
      /react/i,
      /component/i,
      /usestate/i,
      /useeffect/i,
      /props/i,
      /onClick/i,
      /className/i,
      /return \(/i,
      /<div/i,
      /<span/i,
      /<button/i,
      /import.*from.*react/i
    ];

    // Find all AI study plans with React content
    const aiPlansWithReactContent = await StudyPlan.find({
      "subject": { $regex: /artificial.{0,10}intelligence/i },
      $or: reactTerms.map(term => ({
        $or: [
          { "content": term },
          { "objectives": { $elemMatch: { $regex: term } } },
          { "topics": { $elemMatch: { "content": term } } }
        ]
      }))
    });

    console.log(`Found ${aiPlansWithReactContent.length} AI study plans with React content`);

    // Delete the problematic plans
    const deleteResult = await StudyPlan.deleteMany({
      "subject": { $regex: /artificial.{0,10}intelligence/i },
      $or: reactTerms.map(term => ({
        $or: [
          { "content": term },
          { "objectives": { $elemMatch: { $regex: term } } },
          { "topics": { $elemMatch: { "content": term } } }
        ]
      }))
    });

    console.log(`Deleted ${deleteResult.deletedCount} AI study plans with React content`);

    res.json({
      success: true,
      message: `Cleanup completed successfully`,
      plansFound: aiPlansWithReactContent.length,
      plansDeleted: deleteResult.deletedCount
    });

  } catch (error) {
    console.error('❌ Error during AI study plans cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup AI study plans',
      details: error.message
    });
  }
});

export default router;