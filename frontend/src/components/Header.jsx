import React from "react";
import "./Header.css";
import logo from "../assets/logo_liebherr.svg";

const Header = ({ companyName }) => {
    return (
        <header className="app-header d-flex align-items-center px-4">
            <img src={logo} alt="Liebherr Logo" className="liebherr-logo" />
            {/* <h6 className="ms-3 mb-0 text-white text-uppercase fw-bold d-none d-md-block">
                {companyName}
            </h6> */}
        </header>
    );
};

export default Header;
