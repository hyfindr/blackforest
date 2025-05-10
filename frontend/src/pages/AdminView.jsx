import React, { useState } from "react";
import CategorySelector from "../components/CategorySelector";
import MaterialSpecs from "../components/MaterialSpecs";
import { Alert, Spinner } from "react-bootstrap";
import "./AdminView.css";

const AdminView = () => {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [statusMessage, setStatusMessage] = useState(null);

    return (
        <div className="admin-wrapper container-fluid">
            <h5 className="section-title mb-4">Manage Compliance Norms</h5>

            <CategorySelector
                selected={selectedCategory}
                onSelect={setSelectedCategory}
            />

            {statusMessage && (
                <Alert className="mt-3" variant={statusMessage.type}>
                    {statusMessage.text}
                </Alert>
            )}

            {selectedCategory && (
                <MaterialSpecs categoryId={selectedCategory} />
            )}
        </div>
    );
};

export default AdminView;
