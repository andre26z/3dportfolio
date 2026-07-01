import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { SoundProject } from './projects/SoundProject';
import { SolarSystemProject } from './projects/solar/SolarSystemProject';
import { TerrainProject } from './projects/terrain/TerrainProject';

// Portfolio shell: full-screen project canvas with an overlaid navbar.
export default function App() {
  return (
    <BrowserRouter>
      <div style={{ position: 'fixed', inset: 0 }}>
        <Navbar />
        <Routes>
          {/* Solar system is the landing page */}
          <Route path="/" element={<SolarSystemProject />} />
          <Route path="/projects/solar" element={<SolarSystemProject />} />
          <Route path="/projects/sound" element={<SoundProject />} />
          <Route path="/projects/terrain" element={<TerrainProject />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
