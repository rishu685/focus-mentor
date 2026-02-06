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

async function inspectDetailedPlans() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the most recent 3 plans for detailed inspection
    const recentPlans = await StudyPlan.find().sort({ createdAt: -1 }).limit(3);
    
    console.log('\n🔍 Detailed inspection of recent study plans:');
    
    recentPlans.forEach((plan, index) => {
      console.log(`\n📋 Plan ${index + 1}:`);
      console.log(`  ID: ${plan._id}`);
      console.log(`  User ID: ${plan.userId}`);
      console.log(`  Subject: ${plan.subject}`);
      console.log(`  Duration: ${plan.duration}`);
      console.log(`  Level: ${plan.level}`);
      console.log(`  Created: ${plan.createdAt}`);
      
      if (plan.objectives && plan.objectives.length > 0) {
        console.log(`  Objectives (${plan.objectives.length}): ${plan.objectives.slice(0, 2).join(', ')}...`);
      } else {
        console.log(`  Objectives: None`);
      }
      
      if (plan.topics && plan.topics.length > 0) {
        console.log(`  Topics (${plan.topics.length}): `);
        plan.topics.slice(0, 2).forEach((topic, i) => {
          console.log(`    ${i + 1}. ${topic.title || 'No title'}`);
          if (topic.content) {
            console.log(`       Content: ${topic.content.substring(0, 80)}...`);
          }
        });
      } else {
        console.log(`  Topics: None`);
      }
      
      if (plan.content) {
        console.log(`  Raw Content: ${plan.content.substring(0, 150)}...`);
      } else {
        console.log(`  Raw Content: None`);
      }
    });

    // Clean up undefined subjects
    console.log('\n🧹 Cleaning up plans with undefined subjects...');
    const deleteResult = await StudyPlan.deleteMany({ 
      $or: [
        { subject: "undefined" },
        { subject: { $exists: false } },
        { subject: null }
      ]
    });
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} plans with undefined subjects`);

    const remainingCount = await StudyPlan.countDocuments();
    console.log(`📊 Remaining study plans: ${remainingCount}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error during inspection:', error);
    process.exit(1);
  }
}

inspectDetailedPlans();