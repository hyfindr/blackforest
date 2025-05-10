import React from "react";
import { Button } from "react-bootstrap";
import { UserCircle, Settings } from "lucide-react";
import "./Sidebar.css";

const Sidebar = ({ currentRole, onChangeRole }) => {
    return (
        <div className="position-sticky pt-3 sidebar-sticky">
            <ul className="nav flex-column">
                <li className="nav-item mb-3">
                    <Button
                        variant={
                            currentRole === "User"
                                ? "primary"
                                : "outline-secondary"
                        }
                        className={`w-100 d-flex align-items-center sidebar-btn ${
                            currentRole === "User" ? "active" : ""
                        }`}
                        onClick={() => onChangeRole("User")}
                    >
                        <UserCircle size={18} className="me-2" />
                        User
                    </Button>
                </li>
                <li className="nav-item">
                    <Button
                        variant={
                            currentRole === "Admin"
                                ? "primary"
                                : "outline-secondary"
                        }
                        className={`w-100 d-flex align-items-center sidebar-btn ${
                            currentRole === "Admin" ? "active" : ""
                        }`}
                        onClick={() => onChangeRole("Admin")}
                    >
                        <Settings size={18} className="me-2" />
                        Admin
                    </Button>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;
