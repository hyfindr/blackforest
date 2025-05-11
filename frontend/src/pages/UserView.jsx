import React, { useState } from "react";
import CategorySelector from "../components/CategorySelector";
import FileUpload from "../components/FileUpload";

const UserView = () => {
    const [category, setCategory] = useState(null);

    return (
        <div className="admin-wrapper container-fluid">
            <h5 className="section-title mb-4">Validate Certificate</h5>
            <CategorySelector selected={category} onSelect={setCategory} />
            {category && <FileUpload selectedCategory={category} />}
        </div>
    );
};

export default UserView;
