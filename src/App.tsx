// /src/App.tsx (Final)

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WelcomePage from './pages/WelcomePage';
import ScanPage from './pages/ScanPage';
import AnalysisPage from './pages/AnalysisPage'; // <-- Add import
import HandoffPage from './pages/HandoffPage'; // <-- Add import
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/analysis" element={<AnalysisPage />} /> {/* <-- Add route */}
        <Route path="/handoff" element={<HandoffPage />} /> {/* <-- Add route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;