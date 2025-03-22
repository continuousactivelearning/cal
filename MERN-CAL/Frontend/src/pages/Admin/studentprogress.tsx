import express from 'express';
import { https } from 'firebase-functions';
import { PrismaClient } from '@prisma/client';  // Import Prisma Client
import AssessmentGrading from './routes/AssessmentGrading';
import ProgressTracking from './routes/ProgressTracking';
import FetchProgress from './routes/FetchProgress';
import GoogleAuthhVerification from './routes/GoogleAuthhVerification';
import BulkProcess from './routes/BulkProgress';
import Streak from './routes/Streak';
import cors from 'cors';
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

const allowedOrigins = '*';
console.log("Allowed CORS Origins:", allowedOrigins); // Debugging
const app = express();

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const prisma = new PrismaClient();
const PORT = 8080;

// Use CORS middleware first with dynamic origins
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// JSON parser middleware
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).send('CALM Activity Engine');
});

// New endpoint to fetch weekly progress data
app.get('/api/weekly-progress', async (req, res) => {
  try {
    const weeklyProgress = await prisma.weeklyProgress.findMany(); // Replace with your actual Prisma query
    res.json(weeklyProgress);  // Return the weekly progress data as JSON
  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    res.status(500).json({ error: 'Error fetching weekly progress' });
  }
});

// Add existing routes for other functionality
app.use(AssessmentGrading);
app.use(ProgressTracking);
app.use(GoogleAuthhVerification);
app.use(BulkProcess);
app.use(FetchProgress);
app.use(Streak);

// Firebase function export
exports.activityEngine = https.onRequest(app);

// Start server for local development
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

