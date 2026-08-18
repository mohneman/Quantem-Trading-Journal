import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ForgotPage, LoginPage, ResetPage, SignupPage } from "./pages/AuthPages";
import { DashboardPage } from "./pages/DashboardPage";
import { JournalsPage } from "./pages/JournalsPage";
import {
  MindMapCanvasPage,
  MindMapsPage,
  NotebookHomePage,
  NotesEditorPage,
} from "./pages/NotebookPages";
import { PortfolioPage } from "./pages/PortfolioPage";
import {
  AffiliatePage,
  BacktestsPage,
  CalculatorPage,
  CalendarPage,
  CouponsPage,
  PayoutJournalPage,
  PayoutsPage,
  StatsPage,
} from "./pages/RestPages";
import { TradesPage } from "./pages/TradesPage";
import { useStore } from "./store";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session } = useStore();
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot" element={<ForgotPage />} />
      <Route path="/reset" element={<ResetPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="trades" element={<TradesPage />} />
        <Route path="journals" element={<JournalsPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="notebook" element={<NotebookHomePage />} />
        <Route path="notebook/notes" element={<NotesEditorPage />} />
        <Route path="notebook/maps" element={<MindMapsPage />} />
        <Route path="notebook/maps/:id" element={<MindMapCanvasPage />} />
        <Route path="calculator" element={<CalculatorPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="backtests" element={<BacktestsPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="payouts" element={<PayoutsPage />} />
        <Route path="payout-journal" element={<PayoutJournalPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="affiliate" element={<AffiliatePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
