import mongoose from 'mongoose';

const syllabusSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  university: {
    type: String,
    required: true
  },
  course: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: false
  },
  year: {
    type: String,
    required: false
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    required: true
  },
  subjects: [{
    name: String,
    topics: [String],
    weightage: String,
    description: String
  }],
  aiAnalysis: {
    overview: String,
    keyTopics: [String],
    difficulty: String,
    recommendations: [String],
    estimatedHours: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance
syllabusSchema.index({ userId: 1, university: 1, course: 1 });
syllabusSchema.index({ userId: 1, isActive: 1 });

export const Syllabus = mongoose.models.Syllabus || mongoose.model('Syllabus', syllabusSchema);