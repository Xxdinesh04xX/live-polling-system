import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import { RoleSelectionPage } from "./pages/RoleSelectionPage";
import { StudentPage } from "./pages/StudentPage";
import { TeacherPage } from "./pages/TeacherPage";
import { PollHistoryPage } from "./pages/PollHistoryPage";
import { StudentHistoryPage } from "./pages/StudentHistoryPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelectionPage />} />
        <Route path="/student" element={<StudentPage />} />
        <Route path="/student/history" element={<StudentHistoryPage />} />
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="/teacher/history" element={<PollHistoryPage />} />
        <Route path="*" element={<RoleSelectionPage />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
