import React, { useState } from "react";
import CategorySelector from "../components/CategorySelector";
import FileUpload from "../components/FileUpload";

const UserView = () => {
    const [category, setCategory] = useState(null);

    return (
        <div className="p-4 w-100">
            <CategorySelector selected={category} onSelect={setCategory} />
            {category && <FileUpload selectedCategory={category} />}
        </div>
    );
};

export default UserView;
