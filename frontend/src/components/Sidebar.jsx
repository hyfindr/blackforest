import React from "react";
import { Button } from "react-bootstrap";
import { UploadCloud, Settings, CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ showSidebar, toggleSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className={`sidebar-wrapper ${showSidebar ? "open" : ""}`}>
            <ul className="nav flex-column gap-3">
                <li className="nav-item">
                    <Button
                        variant={
                            isActive("/upload")
                                ? "primary"
                                : "outline-secondary"
                        }
                        className={`w-100 d-flex align-items-center sidebar-btn rounded-0 fw-bold ${
                            isActive("/upload") ? "active" : ""
                        }`}
                        onClick={() => {
                            navigate("/upload");
                            toggleSidebar();
                        }}
                    >
                        <UploadCloud size={18} className="me-2" />
                        Validate Certificate
                    </Button>
                </li>
                <li className="nav-item">
                    <Button
                        variant={
                            isActive("/validations")
                                ? "primary"
                                : "outline-secondary"
                        }
                        className={`w-100 d-flex align-items-center sidebar-btn rounded-0 fw-bold ${
                            isActive("/validations") ? "active" : ""
                        }`}
                        onClick={() => {
                            navigate("/validations");
                            toggleSidebar();
                        }}
                    >
                        <CheckCircle size={18} className="me-2" />
                        Validated Suppliers
                    </Button>
                </li>
                <li className="nav-item">
                    <Button
                        variant={
                            isActive("/admin") ? "primary" : "outline-secondary"
                        }
                        className={`w-100 d-flex align-items-center sidebar-btn rounded-0 fw-bold ${
                            isActive("/admin") ? "active" : ""
                        }`}
                        onClick={() => {
                            navigate("/admin");
                            toggleSidebar();
                        }}
                    >
                        <Settings size={18} className="me-2" />
                        Manage Specs
                    </Button>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;
