import React, { useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import "./App.css";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import UserView from "./pages/UserView";
import AdminView from "./pages/AdminView";
import ValidatedSuppliers from "./pages/ValidatedSuppliers";
import ValidationDetails from "./pages/ValidationDetails";

const App = () => {
    const [showSidebar, setShowSidebar] = useState(false);

    const toggleSidebar = () => setShowSidebar((prev) => !prev);

    return (
        <Router>
            <div className="d-flex flex-column min-vh-100">
                {/* Top Header */}
                <Header
                    companyName="LIEBHERR"
                    onToggleSidebar={toggleSidebar}
                />

                <div className="container-fluid flex-grow-1">
                    <div className="row h-100">
                        {/* Sidebar (visible on desktop, slide-out on mobile) */}
                        <div className="col-12 col-md-4 col-lg-3 p-2">
                            <Sidebar
                                showSidebar={showSidebar}
                                toggleSidebar={toggleSidebar}
                            />
                        </div>

                        {/* Main Content */}
                        <main className="col-12 col-md-8 col-lg-9 px-md-4 py-4">
                            <Routes>
                                <Route
                                    path="/"
                                    element={<Navigate to="/upload" />}
                                />
                                <Route path="/upload" element={<UserView />} />
                                <Route path="/admin" element={<AdminView />} />
                                <Route
                                    path="/validations"
                                    element={<ValidatedSuppliers />}
                                />
                                <Route
                                    path="/details/:id"
                                    element={<ValidationDetails />}
                                />
                            </Routes>
                        </main>
                    </div>
                </div>
            </div>
        </Router>
    );
};

export default App;
