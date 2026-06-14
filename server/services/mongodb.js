import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('MONGODB_URI is not defined. MongoDB features will be disabled.');
} else {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
}

const ResumeAnalysisSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  fileName: String,
  fileType: String,
  industry: String,
  resumeText: String,
  parsedSections: Object,
  jobDescription: String,
  analysis: Object,
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 3600 // Auto-delete after 1 hour (3600 seconds)
  }
});

export const ResumeAnalysis = mongoose.models.ResumeAnalysis || mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
