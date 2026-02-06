import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define the StudyPlan schema inline
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

async function inspectDatabase() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count all study plans
    const totalPlans = await StudyPlan.countDocuments();
    console.log(`📊 Total study plans in database: ${totalPlans}`);

    // Find AI-related plans
    const aiPlans = await StudyPlan.find({
      "subject": { $regex: /artificial.{0,10}intelligence/i }
    });
    console.log(`🤖 AI-related study plans: ${aiPlans.length}`);

    // Find any plans with React content
    const reactPlans = await StudyPlan.find({
      $or: [
        { "content": /react/i },
        { "subject": /react/i },
        { "objectives": { $elemMatch: { $regex: /react/i } } },
        { "topics": { $elemMatch: { "content": /react/i } } }
      ]
    });
    console.log(`⚛️ Plans containing 'React': ${reactPlans.length}`);

    // Show some sample plans to understand the structure
    const samplePlans = await StudyPlan.find().limit(5);
    console.log('\n📝 Sample plans in database:');
    samplePlans.forEach((plan, index) => {
      console.log(`  ${index + 1}. Subject: "${plan.subject}"`);
      console.log(`     User: ${plan.userId}`);
      console.log(`     Created: ${plan.createdAt}`);
      if (plan.content) {
        console.log(`     Content preview: ${plan.content.substring(0, 100)}...`);
      }
      console.log('');
    });

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error during inspection:', error);
    process.exit(1);
  }
}

inspectDatabase();