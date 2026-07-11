import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import './index.css';

const App = lazy(() => import('../app/app'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const FailurePage = lazy(() => import('./pages/FailurePage'));
const PendingPage = lazy(() => import('./pages/PendingPage'));
const TerminosPage = lazy(() => import('./pages/TerminosPage'));

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-background">
    <Loader2 className="h-10 w-10 animate-spin text-brand-primary" />
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: 'easeInOut' }}
        style={{ width: '100%' }}
      >
        <Routes location={location}>
          <Route path="/" element={<App />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/failure" element={<FailurePage />} />
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/terminos" element={<TerminosPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <AnimatedRoutes />
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
);
