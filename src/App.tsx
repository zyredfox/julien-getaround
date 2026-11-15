import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CryptoLayout } from "@/layouts/CryptoLayout";
import { GetaroundLayout } from "@/layouts/GetaroundLayout";
import { PeaLayout } from "@/layouts/PeaLayout";
import { BilanPage } from "@/pages/BilanPage";
import { CryptoHomePage } from "@/pages/CryptoHomePage";
import { CryptoPositionsPage } from "@/pages/CryptoPositionsPage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { LoginPage } from "@/pages/LoginPage";
import { MorePage } from "@/pages/MorePage";
import { PeaHomePage } from "@/pages/PeaHomePage";
import { PeaPositionsPage } from "@/pages/PeaPositionsPage";
import { PortfolioHomePage } from "@/pages/PortfolioHomePage";
import { RentalsPage } from "@/pages/RentalsPage";
import { TaxesPage } from "@/pages/TaxesPage";
import { VehiclePage } from "@/pages/VehiclePage";
import { VehiclesPage } from "@/pages/VehiclesPage";

function RedirectLegacyVehicle() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/getaround/vehicules/${id ?? ""}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<PortfolioHomePage />} />

            <Route path="getaround" element={<GetaroundLayout />}>
              <Route index element={<BilanPage />} />
              <Route path="locations" element={<RentalsPage />} />
              <Route path="depenses" element={<ExpensesPage />} />
              <Route path="impots" element={<TaxesPage />} />
              <Route path="vehicules" element={<VehiclesPage />} />
              <Route path="vehicules/:id" element={<VehiclePage />} />
            </Route>

            <Route path="pea" element={<PeaLayout />}>
              <Route index element={<PeaHomePage />} />
              <Route path="positions" element={<PeaPositionsPage />} />
            </Route>

            <Route path="crypto" element={<CryptoLayout />}>
              <Route index element={<CryptoHomePage />} />
              <Route path="positions" element={<CryptoPositionsPage />} />
            </Route>

            <Route path="plus" element={<MorePage />} />

            {/* Anciennes URLs → nouveaux chemins */}
            <Route path="locations" element={<Navigate to="/getaround/locations" replace />} />
            <Route path="depenses" element={<Navigate to="/getaround/depenses" replace />} />
            <Route path="impots" element={<Navigate to="/getaround/impots" replace />} />
            <Route path="vehicules" element={<Navigate to="/getaround/vehicules" replace />} />
            <Route path="vehicules/:id" element={<RedirectLegacyVehicle />} />
            <Route path="vehicule" element={<Navigate to="/getaround/vehicules" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
