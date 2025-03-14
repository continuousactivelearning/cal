import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Clock, Award, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Chart } from '@/components/ChartDashboard';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCoursesWithAuth } from '@/store/slices/courseSlice';
import { fetchWeeklyProgress } from '@/store/slices/FetchWeeklyProgress'; // Corrected import path
import { DataTableDemo } from '@/components/dashboardProgressTable';
import { useLocation } from 'react-router-dom';
import { AppDispatch } from '@/store';

const StudentDashboard = () => {
  const [completedCourses, setCompletedCourses] = useState(0);
  const [averageProgress, setAverageProgress] = useState(0);

  const dispatch: AppDispatch = useDispatch();
  const location = useLocation();

  // Fetch data from Redux store
  const CourseData = useSelector((state: { courses: { courses: any[] } }) => 
    state.courses.courses ?? []
  );
  const courseProgressData = useSelector((state: { weeklyProgress: { weeklyProgress: any } }) => 
    state.weeklyProgress?.weeklyProgress?.courseData ?? {}
  );

  // Fetch data on initial load and when navigating to the dashboard
  useEffect(() => {
    console.log('Current route:', location.pathname);
    console.log('Dispatching fetchWeeklyProgress for route:', location.pathname);
    dispatch(fetchWeeklyProgress()); // Dispatch the action
  }, [dispatch, location.pathname]);


  useEffect(() => {
    console.log('Courses:', CourseData)
    if (!CourseData || CourseData.length === 0) {
      console.log('Dispatching fetchCoursesWithAuth')
      dispatch(fetchCoursesWithAuth())
    }
  }, [dispatch, CourseData])


  // Calculate average progress when courseProgressData changes
  useEffect(() => {
    if (Object.keys(courseProgressData || {}).length > 0) {
      const calculateLatestAverageProgress = (data: any): number => {
        let completed = 0;
        const latestEntries = Object.keys(data).map((courseKey) => {
          const entries = data[courseKey];
          const sortedEntries = [...entries].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          const latestProgress = sortedEntries[0].User;
          if (latestProgress === 100) completed += 1;
          return latestProgress;
        });
        setCompletedCourses(completed);
        return latestEntries.length > 0 
          ? latestEntries.reduce((acc, curr) => acc + curr, 0) / latestEntries.length 
          : 0;
      };
      setAverageProgress(calculateLatestAverageProgress(courseProgressData));
    }
  }, [courseProgressData]);

  return (
    <div className='h-full'>
      {/* Dashboard metrics cards */}
      <div className='grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Courses</CardTitle>
            <BookOpen className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{CourseData?.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Courses</CardTitle>
            <Clock className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{CourseData?.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>All Courses Average Progress</CardTitle>
            <TrendingUp className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {Math.round(averageProgress)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Completed</CardTitle>
            <Award className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{completedCourses}</div>
          </CardContent>
        </Card>
      </div>

      {/* Course tables section */}
      <div className='grid h-[calc(100%-140px)] grid-cols-2 gap-4 p-4'>
        <Chart />
        <div className='flex h-full flex-col rounded-lg border'>
          <div className='flex-1 px-6 py-4'>
            <DataTableDemo />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;