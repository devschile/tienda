import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import './index.css';

const App = lazy(() => import('../app/app'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const FailurePage = lazy(() => import('./pages/FailurePage'));
const PendingPage = lazy(() => import('./pages/PendingPage'));

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-background">
    <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/failure" element={<FailurePage />} />
          <Route path="/pending" element={<PendingPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
