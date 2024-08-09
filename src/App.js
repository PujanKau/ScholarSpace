import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './Components/LandingPage';
import StudentAuthPage from './Components/StudentAuthPage';
import AdminAuthPage from './Components/AdminAuthPage';
import ManageCourses from './Components/ManageCourses';
import ViewCourses from './Components/ViewCourses';
import AddCourse from './Components/AddCourse';
import EditCourse from './Components/EditCourse';
import ManageUsers from './Components/ManageUsers';
import AddUser from './Components/AddUser';
import ViewUsers from './Components/ViewUsers';
import EditUser from './Components/EditUser';
import Reports from './Components/Reports';
import Settings from './Components/Settings';
import EmployerAuthPage from './Components/EmployerAuthPage';
import StudentOnboarding from './Components/StudentOnboarding';
import StudentDashboard from './Components/StudentDashboard';
import JobListings from './Components/JobListings';
import EmployerDashboard from './Components/EmployerDashboard';
import AdminDashboard from './Components/AdminDashboard';
import PostJob from './Components/PostJob';
import EditJob from './Components/EditJob';
import JobDetails from './Components/JobDetails';
import ViewApplications from './Components/ViewApplications';
import ApplicationDetails from './Components/ApplicationDetails';
import Courses from './Components/Courses';
import ApplyJobForm from './Components/ApplyJobForm'; 
import EmployerList from './Components/EmployerList';
import EmployerDetails from './Components/EmployerDetails';
import CourseDetails from './Components/CourseDetails';
import Profile from './Components/ProfilePage'
import { UserProvider } from './Components/UserContext';
import { JobProvider } from './Components/JobContext';
import './App.css';

const App = () => {
  const apiUrl = process.env.REACT_APP_API_URL;

  return (
    <UserProvider>
      <JobProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/student" element={<StudentAuthPage apiUrl={apiUrl} />} />
              <Route path="/admin" element={<AdminAuthPage apiUrl={apiUrl} />} />
              <Route path="/employer" element={<EmployerAuthPage apiUrl={apiUrl} />} />
              <Route path="/profile/:userId" element={<Profile apiUrl={apiUrl} />} />


              {/* Student Routes */}
              <Route path="/student-onboarding" element={<StudentOnboarding />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/jobs" element={<JobListings apiUrl={apiUrl} />} />
              <Route path="/apply-job/:jobId" element={<ApplyJobForm apiUrl={apiUrl} />} />
              <Route path="/job-details/:jobId" element={<JobDetails apiUrl={apiUrl} />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:courseId" element={<CourseDetails />} />

              {/* Employer Routes */}
              <Route path="/employer/dashboard" element={<EmployerDashboard apiUrl={apiUrl} />} />
              <Route path="/employer/post-job" element={<PostJob apiUrl={apiUrl} />} />
              <Route path="/employer/edit-job/:jobId" element={<EditJob apiUrl={apiUrl} />} />
              <Route path="/employer/view-applications" element={<ViewApplications apiUrl={apiUrl} />} />
              <Route path="/employer/application-details/:applicationId" element={<ApplicationDetails apiUrl={apiUrl} />} />
              <Route path="/employers" element={<EmployerList apiUrl={apiUrl} />} />
              <Route path="/employers/:employerId" element={<EmployerDetails apiUrl={apiUrl} />} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard apiUrl={apiUrl} />} />
              <Route path="/admin/manage-courses" element={<ManageCourses />} />
              <Route path="/admin/view-courses" element={<ViewCourses />} />
              <Route path="/admin/add-course" element={<AddCourse />} />
              <Route path="/admin/edit-course" element={<EditCourse />} />
              <Route path="/admin/manage-users" element={<ManageUsers />} />
              <Route path="/admin/add-user" element={<AddUser />} />
              <Route path="/admin/view-users" element={<ViewUsers />} />
              <Route path="/admin/edit-user" element={<EditUser />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Routes>
          </div>
        </Router>
      </JobProvider>
    </UserProvider>
  );
}

export default App;
