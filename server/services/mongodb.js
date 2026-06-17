import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is missing');
    return;
  }
  return mongoose.connect(MONGODB_URI);
};

// Auto-connect on import
connectDB().catch(err => console.error('Initial connection failed:', err));

export { connectDB };

const ResumeAnalysisSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  fileName: String,
  fileType: String,
  industry: String,
  resumeText: String,
  parsedSections: Object,
  jobDescription: String,
  analysis: Object,
  createdAt: { type: Date, default: Date.now },
  expireAt: { type: Date, index: { expires: '0s' } }
});

export const ResumeAnalysis = mongoose.models.ResumeAnalysis || mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
