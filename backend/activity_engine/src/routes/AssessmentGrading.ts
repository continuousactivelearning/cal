import { Router } from 'express';
import * as AssessmentGrading from '../controllers/AssessmentGrading';
import * as AssessmentSubmission from '../controllers/AssessmentSubmission';

const router = Router();

router.post('/startAssessment', AssessmentGrading.createAttempt);
router.post('/submitAssessment', AssessmentSubmission.submitAssessment);

export default router;