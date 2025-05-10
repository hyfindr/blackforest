import React from "react";
import ValidationDetails from "./pages/ValidationDetails";

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

const App = () => {
    return (
        <Router>
            <div className="d-flex flex-column min-vh-100">
                <Header companyName="LIEBHERR" />

                <div className="container-fluid flex-grow-1">
                    <div className="row h-100">
                        <nav
                            id="sidebarMenu"
                            className="col-md-3 col-lg-2 bg-body-tertiary sidebar p-3 min-vh-100"
                        >
                            <Sidebar />
                        </nav>

                        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
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
