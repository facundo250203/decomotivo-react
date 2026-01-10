// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Inicio from './pages/Inicio';
import Productos from './pages/Productos';
import Contacto from './pages/Contacto';
import Tablas from './pages/Tablas';
import MatesVasos from './pages/MatesVasos';
import MDF from './pages/MDF';
import Otros from './pages/Otros';
import Combos from './pages/Combos';
import Decoraciones from './pages/Decoraciones';
import FAQ from './pages/FAQ';
import Gracias from './pages/Gracias';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Inicio />} />
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/productos" element={<Productos />} />
              <Route path="/contacto" element={<Contacto />} />
              <Route path="/tablas" element={<Tablas />} />
              <Route path="/mates-vasos" element={<MatesVasos />} />
              <Route path="/mdf" element={<MDF />} />
              <Route path="/otros" element={<Otros />} />
              <Route path="/combos" element={<Combos />} />
              <Route path="/decoraciones" element={<Decoraciones />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/gracias" element={<Gracias />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;