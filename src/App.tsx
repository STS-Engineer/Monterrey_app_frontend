import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";      
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import AddMachineForm from "./pages/Addmachineform";
import { HistoricalTimeline } from "./Historic";
import Homepage from "./pages/Homepage";
import Addmachineformviewer from "./pages/Addmachineformviewer";
import Homepageviewer from "./pages/Homepage viewer";
import Addmaintenance from "./pages/Addmaintenance";
import RoleAssignment from "./pages/RoleAssignment";
import Maintenancedetails from "./pages/Maintenancedetails";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MaintenanceWorkflow from "./pages/MaintenanceWorkflow";
import ManagerReviewPanel from "./pages/ManagerMaintenanceReview";
import Viewmaintenaceviewer from "./pages/Viewmaintenanceviewer";
import Addmaintenanceviewer from "./pages/Addmaintenaceviewer";
import TeamAssignmentForManager from "./pages/TeamAssignmentForManager";
import AlertTable from "./pages/AlertTable";
import Addfailure from "./pages/Addfailure";
import Failurelist from "./pages/FailureList";
import MachineQRCode from "./pages/MachineQRCode";
import MachinesQrcode from "./pages/AllMachinesQR";
import MachineDetail from "./pages/MachineDetail";



export default function App() {
  const currentUser = localStorage.getItem('user_id');
    // Wrapper to extract machineId from URL
  function MachineQRCodeWrapper() {
  const { machineId } = useParams();
  return <MachineQRCode machineId={machineId} />;
   }
  return (
    <Router>
      <ScrollToTop />
      
{/* Global Toast Notification Container */}
<ToastContainer position="top-center" autoClose={3000} />
      <Routes>
         <Route index path="/" element={<SignIn />} />
        {/* Protected Pages with Sidebar/Header Layout */}
        <Route element={<AppLayout />}>
          <Route path="/home" element={<Home />} />
          {/* Pages under layout */}
          <Route path="/profile" element={<UserProfiles />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/blank" element={<Blank />} />
          <Route path="/form-elements" element={<FormElements />} />
          <Route path="/basic-tables" element={<BasicTables />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/badge" element={<Badges />} />
          <Route path="/buttons" element={<Buttons />} />
          <Route path="/images" element={<Images />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/line-chart" element={<LineChart />} />
          <Route path="/bar-chart" element={<BarChart />} />
          <Route path="/addmachine" element={<AddMachineForm />} />
          <Route path="/maintenancehistory" element={<HistoricalTimeline />} />
          <Route path="/machinelist" element={<Homepage />} />
          <Route path="/machineqr/:machineId" element={<MachineQRCodeWrapper />} />
          <Route path="/MachinesQrcodes" element={<MachinesQrcode />} />
          <Route path="/machine/:machineId" element={<MachineDetail />} />
          <Route path="/addmaintenanceviewer" element={<Addmaintenanceviewer />} />
          <Route path="/maintenanceviewer" element={<Viewmaintenaceviewer />} />
          <Route path="/addmachineviewer" element={<Addmachineformviewer />} />
          <Route path="/machineviewer" element={<Homepageviewer />} />
          {/*Maintenance*/}
          <Route path="/addmaintenace" element={<Addmaintenance />} />
          <Route path="/maintenancedetails" element={<Maintenancedetails />} />
           {/*maintenace executor task*/}
          <Route path="/executorrequest" element={<MaintenanceWorkflow />} />
          {/*ManagerMaintenaceReview*/}
          <Route path="/manager/reviews" element={<ManagerReviewPanel managerId={currentUser} />} />

         
         {/*Failure*/}
          <Route path="/addfailure" element={<Addfailure />} />
          <Route path="/failurelist" element={<Failurelist />} />
         {/*roleassign*/}
          <Route path="/roleassign" element={<RoleAssignment />} />
           <Route path="/teamassignment" element={<TeamAssignmentForManager />} />
        {/*systemalerts*/}
           <Route path="/alertss" element={<AlertTable />} />
        </Route>
    
        {/* Auth Pages - No Layout */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
