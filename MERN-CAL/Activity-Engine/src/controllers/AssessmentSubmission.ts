  import { PrismaClient } from "@prisma/client";
  import { Request, Response } from "express";
  import axios from "axios";
  import LMS_URL from "../contant";

  const prisma = new PrismaClient();



  
  async function calculateSectionStreak(studentId: string, sectionId: string, courseInstanceId: string) {
    // ✅ Fetch all assessments for this section, sorted by submission order
    const sectionAssessments = await prisma.submitSession.findMany({
        where: {
            studentId,
            sectionId,
            courseId: courseInstanceId
        },
        select: {
            assessmentId: true,
            attemptId: true,
            isAnswerCorrect: true,
            createdAt: true
        },
        orderBy: {
            createdAt: "asc" // Sort in order of completion
        }
    });

    if (!sectionAssessments.length) return { currentStreak: 0, longestStreak: 0 }; // No assessments taken → streak is 0

    let currentStreak = 0; // 🔹 Tracks the current streak (resets if incorrect attempt happens)
    let longestStreak = 0; // 🔹 Tracks the longest streak ever
    let lastAssessmentId = null; // 🔹 To track consecutive assessments

    for (const attempt of sectionAssessments) {
        if (attempt.isAnswerCorrect) {
            if (attempt.attemptId > 1) {
                // ✅ If it's a retry but correct, restart streak at 1
                currentStreak = 1;
            } else if (lastAssessmentId === null || attempt.assessmentId !== lastAssessmentId) {
                // ✅ If it's a new assessment and correct, increase streak
                currentStreak += 1;
            }
            longestStreak = Math.max(longestStreak, currentStreak); // ✅ Update longest streak
        } else {
            currentStreak = 0; // ❌ Reset streak if incorrect attempt
        }

        lastAssessmentId = attempt.assessmentId; // Track last assessment
    }

    return { currentStreak, longestStreak }; // ✅ Return both streaks
}






export async function submitAssessment(
    req: Request,
    res: Response
  ): Promise<void> {
      const { studentId, courseId, sectionId, assessmentId, attemptId, questionId, answers } = req.body;
      const authorization = req.headers.authorization;
  
      if (!authorization || !authorization.startsWith("Bearer ")) {
        res.status(401).send({ message: "Unauthorized" });
        return;
      }
  
      const idToken = authorization.split("Bearer ")[1];
  
      const processedAnswers = Array.isArray(answers) ? answers : [answers];
  
      try {
          // ✅ Get the correct answers from LMS API
          const { data: solutionData } = await axios.get(
              `${LMS_URL}/api/questions/solution/?question_id=${questionId}`,
              { headers: { Authorization: `Bearer ${idToken}` } }
          );
  
          // ✅ Check if the answer is correct
          const isCorrect = Array.isArray(solutionData.answer) &&
            processedAnswers.length === solutionData.answer.length &&
            processedAnswers.every(answer => solutionData.answer.includes(answer));
  
          // ✅ Store the submission in `submitSession`
          const newSubmit = await prisma.submitSession.create({
              data: { studentId, courseId, sectionId, assessmentId, attemptId, questionId, answers: processedAnswers, isAnswerCorrect: isCorrect }
          });
  
          // ✅ Calculate updated streaks
          const { currentStreak, longestStreak } = await calculateSectionStreak(studentId, sectionId, courseId);
  
          // ✅ Store or update streaks in the Streak model
          await prisma.streak.upsert({
              where: { studentId_sectionId: { studentId, sectionId } }, // Using unique constraint
              update: { currentStreak, longestStreak },
              create: { studentId, sectionId, currentStreak, longestStreak }
          });
  
          // ✅ Return the updated streak along with submission details
          res.json({ ...newSubmit, currentStreak, longestStreak });
      } catch (error) {
          console.error("Failed to submit assessment:", error);
          res.status(500).send({
              message: `Error submitting assessment: ${(error as Error).message || 'Unknown error'}`,
          });
      }
  }
  
  


