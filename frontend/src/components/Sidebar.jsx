import React from "react";
import { Button } from "react-bootstrap";
import { UploadCloud, Settings, CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className="position-sticky pt-3 sidebar-sticky">
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
                        onClick={() => navigate("/upload")}
                    >
                        <UploadCloud size={18} className="me-2" />
                        Validate Certificate
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
                        onClick={() => navigate("/admin")}
                    >
                        <Settings size={18} className="me-2" />
                        Manage Specs
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
                        onClick={() => navigate("/validations")}
                    >
                        <CheckCircle size={18} className="me-2" />
                        Validated Suppliers
                    </Button>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;
