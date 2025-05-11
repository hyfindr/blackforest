import React from "react";
import { Menu } from "lucide-react";
import "./Header.css";
import logo from "../assets/logo_liebherr.svg";

const Header = ({ companyName, onToggleSidebar }) => {
    return (
        <header className="app-header d-flex align-items-center justify-content-between px-3 py-2 bg-white border-bottom shadow-sm">
            <div className="d-flex align-items-center gap-3">
                <button
                    className="btn btn-light d-md-none p-2 border-0"
                    onClick={onToggleSidebar}
                >
                    <Menu size={22} />
                </button>
                <img src={logo} alt="Liebherr Logo" className="liebherr-logo" />
            </div>
            {/* Sağ taraf istenirse buraya eklenebilir */}
        </header>
    );
};

export default Header;
