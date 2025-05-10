import "./App.css";
import React, { useState } from "react";
import { Paperclip, Package, User } from "lucide-react"; // or Bootstrap Icons

import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import UserView from "./pages/UserView";
import AdminView from "./pages/AdminView";

const App = () => {
    const [role, setRole] = useState("User");

    return (
        <div className="d-flex flex-column min-vh-100">
            {/* Header */}
            <Header companyName="LIEBHERR" />

            {/* Main content area */}
            <div className="container-fluid flex-grow-1">
                <div className="row h-100">
                    {/* Sidebar */}
                    <nav
                        id="sidebarMenu"
                        className="col-md-3 col-lg-2 bg-body-tertiary sidebar p-3 min-vh-100"
                    >
                        <Sidebar currentRole={role} onChangeRole={setRole} />
                    </nav>

                    {/* Main panel */}
                    <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
                        <div className="pb-2 mb-3 border-bottom d-flex justify-content-between align-items-center">
                            <h1 className="h3 mb-0">
                                {role === "User" ? "User Panel" : "Admin Panel"}
                            </h1>
                        </div>

                        {role === "User" ? <UserView /> : <AdminView />}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default App;
