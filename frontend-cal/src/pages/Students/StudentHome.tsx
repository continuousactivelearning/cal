import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
  import { Button } from "@/components/ui/button";
  
const courses = [
    { id: 1, name: "Introduction to AI", duration: "6 weeks" },
    { id: 2, name: "Data Science Basics", duration: "8 weeks" },
    { id: 3, name: "Web Development", duration: "10 weeks" },
    { id: 4, name: "Machine Learning", duration: "12 weeks" },
    { id: 5, name: "Deep Learning", duration: "14 weeks" },
    { id: 6, name: "Cloud Computing", duration: "5 weeks" },
    { id: 7, name: "Cyber Security", duration: "7 weeks" },
    { id: 8, name: "Blockchain Basics", duration: "9 weeks" },
    { id: 9, name: "Internet of Things", duration: "11 weeks" },
    { id: 10, name: "Big Data Analytics", duration: "13 weeks" },
];

const ongoingCourses = [
    { id: 101, name: "Introduction to Python", progression: "50%" },
    { id: 102, name: "Advanced JavaScript", progression: "75%" },
    { id: 103, name: "Data Science Basics", progression: "30%" },
    { id: 104, name: "React for Beginners", progression: "90%" },
    { id: 105, name: "Machine Learning Fundamentals", progression: "20%" },
    { id: 106, name: "Node.js Essentials", progression: "60%" },
    { id: 107, name: "Docker and Kubernetes", progression: "40%" },
    { id: 108, name: "Microservices Architecture", progression: "70%" },
    { id: 109, name: "DevOps Practices", progression: "80%" },
    { id: 110, name: "Agile Methodologies", progression: "55%" },
];
  
  const StudentHome = () => {
    return (
      <ResizablePanelGroup direction="vertical" className="max-w-full h-full bg-gray-50">
        <ResizablePanel defaultSize={50} className="bg-white">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-700">All Courses</h1>
            <Button variant="outline" className="text-gray-600 hover:bg-gray-100">View All</Button>
          </div>
          <div className="px-6 py-4 max-h-60 overflow-auto custom-scroll">
            <Table>
              <TableCaption>All available courses.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.id}</TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell className="text-right">{course.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ResizablePanel>
  
        <ResizableHandle className="bg-gray-300 cursor-pointer" />
  
        {/* On-Going Courses Block */}
        <ResizablePanel defaultSize={50} className="bg-white">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-700">On-Going Courses</h1>
            <Button variant="outline" className="text-gray-600 hover:bg-gray-100">View All</Button>
          </div>
          <div className="px-6 py-4 max-h-60 overflow-auto custom-scroll">
            <Table>
              <TableCaption>Your ongoing courses and their progress.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ongoingCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.id}</TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell className="text-right">{course.progression}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  };
  
  export default StudentHome;
  