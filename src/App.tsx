import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { SoundProject } from './projects/SoundProject';

// Portfolio shell: full-screen project canvas with an overlaid navbar.
export default function App() {
  return (
    <BrowserRouter>
      <div style={{ position: 'fixed', inset: 0 }}>
        <Navbar />
        <Routes>
          {/* Sound visualizer is the landing page */}
          <Route path="/" element={<SoundProject />} />
          <Route path="/projects/sound" element={<SoundProject />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
