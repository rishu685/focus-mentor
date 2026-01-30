import mongoose, { Document, Schema } from 'mongoose';

export interface ISyllabus extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  university: string;
  course: string;
  semester?: string;
  year?: string;
  originalName: string;
  subjects: Array<{
    name: string;
    topics: string[];
    weightage?: string;
    description?: string;
  }>;
  aiAnalysis: {
    overview: string;
    keyTopics: string[];
    difficulty: string;
    recommendations: string[];
    estimatedHours: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const syllabusSchema = new Schema<ISyllabus>({
  userId: { type: String, required: true, index: true },
  university: { type: String, required: true },
  course: { type: String, required: true },
  semester: { type: String },
  year: { type: String },
  originalName: { type: String, required: true },
  subjects: [{
    name: { type: String, required: true },
    topics: [{ type: String }],
    weightage: { type: String },
    description: { type: String }
  }],
  aiAnalysis: {
    overview: { type: String, required: true },
    keyTopics: [{ type: String }],
    difficulty: { type: String, required: true },
    recommendations: [{ type: String }],
    estimatedHours: { type: Number, required: true }
  },
  isActive: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index for better performance
syllabusSchema.index({ userId: 1, createdAt: -1 });

const Syllabus = mongoose.models.Syllabus || mongoose.model<ISyllabus>('Syllabus', syllabusSchema);

export default Syllabus;