import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define the StudyPlan schema inline since we can't import the model
const StudyPlanSchema = new mongoose.Schema({
  userId: String,
  subject: String,
  duration: String,
  level: String,
  objectives: [String],
  topics: [{
    title: String,
    content: String,
    timeAllocation: String
  }],
  content: String,
  createdAt: { type: Date, default: Date.now }
});

const StudyPlan = mongoose.model('StudyPlan', StudyPlanSchema);

async function cleanupAIPlans() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

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
    console.log('🔍 Finding AI study plans with React content...');
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

    console.log(`📊 Found ${aiPlansWithReactContent.length} AI study plans with React content`);

    // Show some examples before deletion
    if (aiPlansWithReactContent.length > 0) {
      console.log('📝 Examples of problematic content found:');
      for (let i = 0; i < Math.min(3, aiPlansWithReactContent.length); i++) {
        const plan = aiPlansWithReactContent[i];
        console.log(`  - Plan ${i+1}: "${plan.subject}" - User: ${plan.userId}`);
        if (plan.content && plan.content.includes('React')) {
          console.log(`    Content snippet: ${plan.content.substring(0, 100)}...`);
        }
      }
    }

    // Delete the problematic plans
    console.log('🗑️ Deleting AI study plans with React content...');
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

    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} AI study plans with React content`);

    // Verify cleanup
    const remainingAIPlans = await StudyPlan.find({
      "subject": { $regex: /artificial.{0,10}intelligence/i }
    });
    
    console.log(`📊 Remaining AI study plans after cleanup: ${remainingAIPlans.length}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
    console.log('\n🎉 Cleanup completed successfully!');
    console.log(`📈 Results: ${deleteResult.deletedCount} plans deleted, ${remainingAIPlans.length} clean AI plans remaining`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupAIPlans();