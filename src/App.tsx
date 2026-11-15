import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { BilanPage } from "@/pages/BilanPage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { LoginPage } from "@/pages/LoginPage";
import { MorePage } from "@/pages/MorePage";
import { RentalsPage } from "@/pages/RentalsPage";
import { TaxesPage } from "@/pages/TaxesPage";
import { VehiclePage } from "@/pages/VehiclePage";
import { VehiclesPage } from "@/pages/VehiclesPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<BilanPage />} />
            <Route path="locations" element={<RentalsPage />} />
            <Route path="depenses" element={<ExpensesPage />} />
            <Route path="impots" element={<TaxesPage />} />
            <Route path="vehicules" element={<VehiclesPage />} />
            <Route path="vehicules/:id" element={<VehiclePage />} />
            <Route path="vehicule" element={<Navigate to="/vehicules" replace />} />
            <Route path="plus" element={<MorePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
