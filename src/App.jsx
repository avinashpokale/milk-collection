import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoadingScreen from './components/LoadingScreen'
// 1. Regular Import (Loads immediately)
import Login from "./pages/Login";

// 2. Lazy Imports (Loads only when needed)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const Layout = lazy(() => import("./components/Layout"));
const RatePage = lazy(() => import("./pages/RatePage"));
const AddCustomer = lazy(() => import("./components/AddCustomer"));
const CustomerList = lazy(() => import("./components/CustomerList"));
const DailyCollection = lazy(() => import("./components/DailyCollection"));
const CollectionList = lazy(() => import("./components/CollectionList"));
const DairyDetails = lazy(() => import("./components/DairyDetails"));
const Billing = lazy(() => import("./components/Billing"));


export default function App() {
  return (
    /* 3. Wrap everything in Suspense */
    <Suspense fallback={<LoadingScreen message="Fetching Routes"/>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rate" element={<RatePage />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/add-customer" element={<AddCustomer />} />
            <Route path="/edit-customer/:id" element={<AddCustomer />} />
            <Route path="/collection" element={<DailyCollection />} />
            <Route path="/edit-collection/:id" element={<DailyCollection />} />
            <Route path="/collection-list" element={<CollectionList />} />
            <Route path="/dairy-details" element={<DairyDetails />} />
            <Route path="/billing" element={<Billing />} />
          </Route>
        </Route>
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<div className="p-10 text-center font-black uppercase">Page Not Found</div>} />
      </Routes>
    </Suspense>
  );
}