import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import {
  CourseProgressData,
  CourseProgressService,
} from "../services/CourseProgressService";

const courseProgressService = new CourseProgressService();

export class CourseProgressController {
  static updateSectionItemProgress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { courseInstanceId, studentId, sectionItemId, cascade } = req.body;

      const updatedEntities =
        await courseProgressService.updateSectionItemProgress(
          courseInstanceId,
          studentId,
          sectionItemId,
          cascade ?? true
        );

      res.status(200).json(updatedEntities);
    } catch (error) {
      next(error); // Forward to error handling middleware
    }
  };
  /**
   * Initializes progress for all students in a course instance.
   *
   * @param req - The HTTP request object.
   * @param res - The HTTP response object.
   * @param next - The next middleware function.
   */
  public async initializeStudentProgress(
    courseData: CourseProgressData
  ): Promise<{ studentCount: number; totalRecords: number }> {
    const { courseInstanceId, studentIds, modules } = courseData;
  
    let totalRecords = 0;
    const progressRecords = [];
  
    // Extract all IDs from the course progress data
    const { modules: moduleIds } = extractAllIds(courseData);
    console.log("I am courseData", courseData);
  
    // Create progress records for each student
    for (const studentId of studentIds) {
      // Check if a TotalProgress record exists for the student and course instance
      const totalProgressExists = await prisma.totalProgress.findUnique({
        where: {
          studentId_courseInstanceId: {
            studentId,
            courseInstanceId,
          },
        },
      });
  
      // If no TotalProgress record exists, create one with progress set to 0
      if (!totalProgressExists) {
        progressRecords.push(
          prisma.totalProgress.create({
            data: {
              studentId,
              courseInstanceId,
              progress: 0,
            },
          })
        );
        totalRecords += 1; // Increment total records count
      }
  
      let previousModuleComplete = true; // Assume the first module has no predecessor
      let moduleData = [];
      let sectionData = [];
      let sectionItemData = [];
  
      for (const module of modules) {
        const moduleProgress = previousModuleComplete
          ? ProgressEnum.IN_PROGRESS
          : ProgressEnum.INCOMPLETE;
        moduleData.push({
          courseInstanceId,
          studentId,
          moduleId: module.moduleId,
          progress: moduleProgress,
        });
  
        let firstSectionInitialized = false;
        for (const section of module.sections) {
          const sectionProgress =
            moduleProgress === ProgressEnum.IN_PROGRESS &&
            !firstSectionInitialized
              ? ProgressEnum.IN_PROGRESS
              : ProgressEnum.INCOMPLETE;
          sectionData.push({
            courseInstanceId,
            studentId,
            sectionId: section.sectionId,
            progress: sectionProgress,
          });
  
          let firstItemInitialized = false;
          for (const item of section.sectionItems) {
            const itemProgress =
              sectionProgress === ProgressEnum.IN_PROGRESS &&
              !firstItemInitialized
                ? ProgressEnum.IN_PROGRESS
                : ProgressEnum.INCOMPLETE;
            sectionItemData.push({
              courseInstanceId,
              studentId,
              sectionItemId: item.sectionItemId,
              progress: itemProgress,
            });
  
            if (!firstItemInitialized) firstItemInitialized = true;
          }
  
          if (!firstSectionInitialized) firstSectionInitialized = true;
        }
  
        // Check if the current module is complete to update the flag for the next module
        const currentModuleProgress =
          await prisma.studentModuleProgress.findUnique({
            where: {
              studentId_moduleId_courseInstanceId: {
                studentId,
                moduleId: module.moduleId,
                courseInstanceId,
              },
            },
            select: { progress: true },
          });
  
        if (
          currentModuleProgress &&
          currentModuleProgress.progress === ProgressEnum.COMPLETE
        ) {
          previousModuleComplete = true;
        } else {
          previousModuleComplete = false;
        }
      }
  
      // Add all prepared data to the progress records
      progressRecords.push(
        prisma.studentModuleProgress.createMany({
          data: moduleData,
          skipDuplicates: true,
        }),
        prisma.studentSectionProgress.createMany({
          data: sectionData,
          skipDuplicates: true,
        }),
        prisma.studentSectionItemProgress.createMany({
          data: sectionItemData,
          skipDuplicates: true,
        })
      );
  
      // Get meta data for modules, sections, and section items
      const { moduleNextData, sectionNextData, sectionItemNextData } =
        getNextData(courseData);
  
      // Use upserts for module, section, and section item meta data
      progressRecords.push(
        ...moduleNextData.map((nextData) =>
          prisma.moduleNext.upsert({
            where: {
              moduleId: nextData.moduleId,
            },
            update: { nextModuleId: nextData.nextModuleId },
            create: nextData,
          })
        ),
        ...sectionNextData.map((nextData) =>
          prisma.sectionNext.upsert({
            where: {
              sectionId: nextData.sectionId,
            },
            update: { nextSectionId: nextData.nextSectionId },
            create: nextData,
          })
        ),
        ...sectionItemNextData.map((nextData) =>
          prisma.sectionItemNext.upsert({
            where: {
              sectionItemId: nextData.sectionItemId,
            },
            update: { nextSectionItemId: nextData.nextSectionItemId },
            create: nextData,
          })
        )
      );
  
      // Increment total records count
      totalRecords +=
        moduleData.length + sectionData.length + sectionItemData.length;
    }
  
    // Execute all progress record updates in a transaction
    try {
      await prisma.$transaction(progressRecords);
      return { studentCount: studentIds.length, totalRecords };
    } catch (error) {
      console.error("Error initializing student progress:", error);
      throw new Error("Failed to initialize student progress");
    }
  }

  static getCourseProgress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = (req as any).user;
      const courseInstanceId: string = req.query.courseInstanceId as string;
      const studentId: string = req.query.studentId as string;

      const progress = await courseProgressService.getCourseProgress(
        courseInstanceId,
        studentId
      );

      res.status(200).json(progress);
    } catch (error) {
      next(error); // Forward to error handling middleware
    }
  };

  static getModuleProgress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const courseInstanceId: string = req.query.courseInstanceId as string;
      const studentId: string = req.query.studentId as string;
      const moduleId: string = req.query.moduleId as string;

      const progress = await courseProgressService.getModuleProgress(
        courseInstanceId,
        studentId,
        moduleId
      );

      res.status(200).json(progress);
    } catch (error) {
      next(error); // Forward to error handling middleware
    }
  };

  static getSectionProgress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const courseInstanceId: string = req.query.courseInstanceId as string;
      const studentId: string = req.query.studentId as string;
      const sectionId: string = req.query.sectionId as string;

      const progress = await courseProgressService.getSectionProgress(
        courseInstanceId,
        studentId,
        sectionId
      );

      res.status(200).json(progress);
    } catch (error) {
      next(error); // Forward to error handling middleware
    }
  };

  static getSectionItemProgress = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const courseInstanceId: string = req.query.courseInstanceId as string;
      const studentId: string = req.query.studentId as string;
      const sectionItemId: string = req.query.sectionItemId as string;

      console.log("courseInstanceId:", courseInstanceId, "studentId:", studentId, "sectionItemId:", sectionItemId);

      const progress = await courseProgressService.getSectionItemProgress(
        courseInstanceId,
        studentId,
        sectionItemId
      );

      console.log("Progress:", progress);

      res.status(200).json(progress);
    } catch (error) {
      next(error); // Forward to error handling middleware
    }
  };
}

export function updateSectionItemProgress(
  arg0: string,
  updateSectionItemProgress: any
) {
  throw new Error("Function not implemented.");
}
export function initializeProgressController(
  arg0: string,
  initializeProgressController: any
) {
  throw new Error("Function not implemented.");
}

export function getCourseProgress(arg0: string, getCourseProgress: any) {
  throw new Error("Function not implemented.");
}

export function getModuleProgress(arg0: string, getModuleProgress: any) {
  throw new Error("Function not implemented.");
}

export function getSectionProgress(arg0: string, getSectionProgress: any) {
  throw new Error("Function not implemented.");
}

export function getSectionItemProgress(
  arg0: string,
  getSectionItemProgress: any
) {
  throw new Error("Function not implemented.");
}
