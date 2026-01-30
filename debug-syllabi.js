import mongoose from 'mongoose';
import { Syllabus } from './server/models/syllabus.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  // Check syllabuses for the specific user
  const syllabi = await Syllabus.find({ userId: '68a41333654fe3d74b90ce7c' });
  console.log('Found syllabi count:', syllabi.length);
  
  syllabi.forEach((s, index) => {
    console.log(`Syllabus ${index + 1}:`);
    console.log('  _id:', s._id.toString());
    console.log('  userId:', s.userId);
    console.log('  university:', s.university);
    console.log('  isActive:', s.isActive);
    console.log('---');
  });
  
  // Try to find by the specific ID we've been testing
  const specificSyllabus = await Syllabus.findById('692fd6abed282a236144dec4');
  console.log('Specific syllabus exists:', !!specificSyllabus);
  if (specificSyllabus) {
    console.log('  Found userId:', specificSyllabus.userId);
    console.log('  Expected userId:', '68a41333654fe3d74b90ce7c');
    console.log('  UserIds match:', specificSyllabus.userId === '68a41333654fe3d74b90ce7c');
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});