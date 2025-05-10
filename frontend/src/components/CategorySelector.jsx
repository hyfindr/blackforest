import React from "react";
import { ButtonGroup, Button } from "react-bootstrap";
import "./CategorySelector.css";

const categories = ["Pins", "Attachment", "Undercarriage"];

const CategorySelector = ({ selected, onSelect }) => {
    return (
        <div className="category-selector-wrapper mt-4">
            <h5 className="section-title mb-3">Select Component Category</h5>
            <ButtonGroup className="w-100">
                {categories.map((category) => (
                    <Button
                        key={category}
                        variant={
                            selected === category
                                ? "custom-selected"
                                : "outline-secondary"
                        }
                        className={`category-btn ${
                            selected === category ? "active" : ""
                        }`}
                        onClick={() => onSelect(category)}
                    >
                        {category}
                    </Button>
                ))}
            </ButtonGroup>
        </div>
    );
};

export default CategorySelector;
