import express from 'express';
import {https} from 'firebase-functions';
import { PrismaClient } from '@prisma/client';
import AssessmentGrading from './routes/AssessmentGrading';
import ProgressTracking from './routes/ProgressTracking';
import GoogleAuthhVerification from './routes/GoogleAuthhVerification';
import cors from 'cors';
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();
// Read and parse the CORS environment variable
const allowedOrigins = process.env.AE_CORS_ALLOWED_ORIGINS
  ? process.env.AE_CORS_ALLOWED_ORIGINS.split(",").map(origin => origin.trim())
  : [];
console.log("Allowed CORS Origins:", allowedOrigins); // Debugging
const app = express();

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const prisma = new PrismaClient();
const PORT = 3000;

// Use CORS middleware first with dynamic origins
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

// Then, use JSON parser
app.use(express.json());
app.get('/', (req, res) => {
    res.status(200).send('CALM Activity Engine');
    });
// After setting up CORS, add your routes
app.use(AssessmentGrading);
app.use(ProgressTracking);
app.use(GoogleAuthhVerification);

exports.activityEngine = https.onRequest(app);
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
