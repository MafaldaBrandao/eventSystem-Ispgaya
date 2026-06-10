import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminCultura from './pages/AdminCultura';
import ClubeCultural from './pages/ClubeCultural';
import ClubeLeitura from './pages/ClubeLeitura';
import EventoCultural from './pages/EventoCultural';
import EventosPage from './pages/EventosPage';
import HomePage from './pages/HomePage';
import LaboratorioAgendaPage from './pages/LaboratorioAgendaPage';
import LaboratorioCultural from './pages/LaboratorioCultural';
import LaboratorioRoadmap from './pages/LaboratorioRoadmap';
import LivroCultural from './pages/LivroCultural';
import NoticiaCultural from './pages/NoticiaCultural';
import NoticiasPage from './pages/NoticiasPage';
import PublicacoesCientificas from './pages/PublicacoesCientificas';
import SessaoCultural from './pages/SessaoCultural';
import Teatro from './pages/Teatro';
import TunaAcademica from './pages/TunaAcademica';
import { appRoot } from './styles/ui';
import InfoCulturaRouteTracker from './components/layout/InfoCulturaRouteTracker';
import ToastViewport from './components/ui/ToastViewport';

function App() {
  return (
    <BrowserRouter>
      <InfoCulturaRouteTracker />
      <div className={appRoot}>
        <ToastViewport />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vida-academica/noticias" element={<NoticiasPage />} />
          <Route path="/vida-academica/noticias/:newsId" element={<NoticiaCultural />} />
          <Route path="/vida-academica/eventos" element={<EventosPage />} />
          <Route path="/vida-academica/eventos/:eventId" element={<EventoCultural />} />
          <Route path="/investigacao/publicacoes-cientificas" element={<PublicacoesCientificas />} />
          <Route path="/laboratorio-cultural" element={<LaboratorioCultural />} />
          <Route path="/laboratorio-cultural/agenda" element={<LaboratorioAgendaPage />} />
          <Route path="/laboratorio-cultural/roadmap" element={<LaboratorioRoadmap />} />
          <Route
            path="/infocultura/*"
            element={<AdminCultura />}
          />
          <Route
            path="/laboratorio-cultural/admin"
            element={<Navigate to="/infocultura/resumo" replace />}
          />
          <Route path="/laboratorio-cultural/tuna" element={<TunaAcademica />} />
          <Route
            path="/laboratorio-cultural/clube-leitura"
            element={<ClubeLeitura />}
          />
          <Route
            path="/laboratorio-cultural/clubes/:clubId"
            element={<ClubeCultural />}
          />
          <Route path="/laboratorio-cultural/livros/:bookId" element={<LivroCultural />} />
          <Route path="/laboratorio-cultural/noticias/:newsId" element={<NoticiaCultural />} />
          <Route path="/laboratorio-cultural/sessoes/:sessionId" element={<SessaoCultural />} />
          <Route path="/laboratorio-cultural/eventos/:eventId" element={<EventoCultural />} />
          <Route path="/laboratorio-cultural/teatro" element={<Teatro />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
