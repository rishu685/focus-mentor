import mongoose from 'mongoose';
import StudyPlan from './server/models/studyPlan.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  const userId = '68a41333654fe3d74b90ce7c';
  console.log('Searching for study plans for userId:', userId);
  
  // Check study plans for the specific user
  const plans = await StudyPlan.find({ userId });
  console.log('Total plans found:', plans.length);
  
  plans.forEach((plan, index) => {
    console.log(`Plan ${index + 1}:`);
    console.log('  _id:', plan._id.toString());
    console.log('  userId:', plan.userId);
    console.log('  subject:', plan.overview?.subject);
    console.log('  isActive:', plan.isActive);
    console.log('  createdAt:', plan.createdAt);
    console.log('---');
  });
  
  // Check for active plans specifically
  const activePlans = await StudyPlan.find({ userId, isActive: true });
  console.log('Active plans found:', activePlans.length);
  
  // Check for 'react' subject plans specifically
  const reactPlans = await StudyPlan.find({
    userId,
    'overview.subject': { $regex: /^react$/i }
  });
  console.log('React subject plans found:', reactPlans.length);
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});