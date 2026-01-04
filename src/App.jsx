// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

import theme from "./theme";

// layout
import AdminLayout from "./layout/AdminLayout";

// auth
import RequireAdmin from "./auth/RequireAdmin";

// pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tours from "./pages/Tours";
import TourCategories from "./pages/TourCategories";
// later: import BlogCategories from "./pages/BlogCategories";

// later: Blogs, Enquiries, etc.

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <BrowserRouter>
        <Routes>
          {/* ---------- PUBLIC / LOGIN ---------- */}
          <Route path="/login" element={<Login />} />

          {/* ---------- PROTECTED ADMIN AREA (NO /admin PREFIX) ---------- */}
          <Route
            path="/"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            {/* when hitting "/" and already authed -> go to /dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />

            <Route path="dashboard" element={<Dashboard />} />
            <Route path="tours" element={<Tours />} />
            {/* <Route path="categories" element={<Categories />} /> */}

            <Route path="categories/tours" element={<TourCategories />} />
            {/* <Route path="categories/blogs" element={<BlogCategories />} /> */}

            {/* later:
            <Route path="blogs" element={<Blogs />} />
            <Route path="enquiries" element={<Enquiries />} />
            <Route path="categories/tour" element={<TourCategories />} />
            <Route path="categories/blog" element={<BlogCategories />} />
            */}
          </Route>

          {/* ---------- FALLBACK ---------- */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
