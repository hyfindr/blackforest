import React, { useState, useEffect } from "react";
import { Table, Form, Button, Alert } from "react-bootstrap";
import CategorySelector from "../components/CategorySelector";
import "./AdminView.css";

// Fallback dummy data
const fallbackData = [
    {
        id: 1,
        category: "Pins",
        parameter: "Hardness",
        min: 50,
        max: 65,
        unit: "HRC",
    },
    {
        id: 2,
        category: "Attachment",
        parameter: "Tensile Strength",
        min: 400,
        max: 600,
        unit: "MPa",
    },
    {
        id: 3,
        category: "Undercarriage",
        parameter: "Yield Strength",
        min: 300,
        max: 550,
        unit: "MPa",
    },
];

const AdminView = () => {
    const [selectedCategory, setSelectedCategory] = useState("Pins");
    const [allNorms, setAllNorms] = useState([]);
    const [filteredNorms, setFilteredNorms] = useState([]);
    const [statusMessage, setStatusMessage] = useState(null);
    const [tempIdCounter, setTempIdCounter] = useState(1000); // geçici id üretici

    // Load norms from API or fallback
    useEffect(() => {
        const fetchNorms = async () => {
            try {
                const res = await fetch("http://localhost:4000/norms");
                if (!res.ok) throw new Error("API call failed");
                const data = await res.json();
                setAllNorms(data);
                setFilteredNorms(
                    data.filter((n) => n.category === selectedCategory)
                );
            } catch (error) {
                console.warn("API fetch failed. Using fallback data.");
                setAllNorms(fallbackData);
                setFilteredNorms(
                    fallbackData.filter((n) => n.category === selectedCategory)
                );
            }
        };
        fetchNorms();
    }, []);

    // Handle category change
    const handleCategoryChange = (newCategory) => {
        setSelectedCategory(newCategory);
        setFilteredNorms(allNorms.filter((n) => n.category === newCategory));
    };

    // Handle min/max input changes
    const handleChange = (index, field, value) => {
        const updated = [...filteredNorms];
        updated[index][field] =
            field === "min" || field === "max" ? Number(value) : value;
        setFilteredNorms(updated);
    };

    const handleAddNorm = () => {
        const newNorm = {
            id: tempIdCounter,
            category: selectedCategory,
            parameter: "New Parameter",
            min: 0,
            max: 0,
            unit: "",
        };

        setTempIdCounter(tempIdCounter + 1);
        setFilteredNorms([newNorm, ...filteredNorms]);
        setAllNorms([newNorm, ...allNorms]);
    };

    // Save updated row to backend
    const handleSave = async (index) => {
        const isNew = filteredNorms[index].id >= 1000;

        const updatedNorm = {
            ...filteredNorms[index],
            id: Number(filteredNorms[index].id), // id'yi sayıya çeviriyoruz
        };

        try {
            const res = await fetch(
                `http://localhost:4000/norms${
                    isNew ? "" : `/${updatedNorm.id}`
                }`,
                {
                    method: isNew ? "POST" : "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updatedNorm),
                }
            );

            if (!res.ok) throw new Error("Save failed");

            setStatusMessage({
                type: "success",
                text: isNew ? "New norm added." : "Norm saved successfully.",
            });
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (error) {
            console.warn("⚠️ Save failed:", error);
            setStatusMessage({
                type: "danger",
                text: "Save failed. Please try again.",
            });
            setTimeout(() => setStatusMessage(null), 3000);
        }
    };

    const handleDelete = async (index) => {
        const normToDelete = filteredNorms[index];
        const isNew = normToDelete.id >= 1000;

        normToDelete.id = Number(normToDelete.id); // 🔧 Kritik düzeltme

        if (isNew) {
            setFilteredNorms(filteredNorms.filter((_, i) => i !== index));
            setAllNorms(allNorms.filter((n) => n.id !== normToDelete.id));
            return;
        }

        try {
            const res = await fetch(
                `http://localhost:4000/norms/${normToDelete.id}`,
                {
                    method: "DELETE",
                }
            );

            if (!res.ok) throw new Error("Failed to delete");

            setFilteredNorms(filteredNorms.filter((_, i) => i !== index));
            setAllNorms(allNorms.filter((n) => n.id !== normToDelete.id));

            setStatusMessage({
                type: "success",
                text: "Norm deleted.",
            });
            setTimeout(() => setStatusMessage(null), 3000);
        } catch (error) {
            console.warn("Delete failed:", error);
            setStatusMessage({
                type: "danger",
                text: "Delete failed. Please try again.",
            });
            setTimeout(() => setStatusMessage(null), 3000);
        }
    };

    return (
        <div className="admin-wrapper container-fluid">
            <h5 className="section-title mb-4">Manage Compliance Norms</h5>

            <CategorySelector
                selected={selectedCategory}
                onSelect={handleCategoryChange}
            />

            <Button className="btn-upload btn-sm mt-3" onClick={handleAddNorm}>
                + Add New Norm
            </Button>

            {statusMessage && (
                <Alert className="mt-3" variant={statusMessage.type}>
                    {statusMessage.text}
                </Alert>
            )}

            <div className="table-responsive mt-4">
                <Table bordered hover className="norm-table align-middle">
                    <thead className="table-light text-uppercase">
                        <tr>
                            <th>Parameter</th>
                            <th>Min</th>
                            <th>Max</th>
                            <th>Unit</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredNorms.map((row, index) => (
                            <tr key={row.id}>
                                <td>
                                    <Form.Control
                                        type="text"
                                        value={row.parameter}
                                        onChange={(e) =>
                                            handleChange(
                                                index,
                                                "parameter",
                                                e.target.value
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <Form.Control
                                        type="number"
                                        value={row.min}
                                        onChange={(e) =>
                                            handleChange(
                                                index,
                                                "min",
                                                e.target.value
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <Form.Control
                                        type="number"
                                        value={row.max}
                                        onChange={(e) =>
                                            handleChange(
                                                index,
                                                "max",
                                                e.target.value
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <Form.Control
                                        type="text"
                                        value={row.unit}
                                        onChange={(e) =>
                                            handleChange(
                                                index,
                                                "unit",
                                                e.target.value
                                            )
                                        }
                                    />
                                </td>
                                <td className="d-flex gap-2">
                                    <Button
                                        variant="dark"
                                        size="sm"
                                        onClick={() => handleSave(index)}
                                        className="rounded-0 text-uppercase fw-bold"
                                    >
                                        Save
                                    </Button>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleDelete(index)}
                                        className="rounded-0 text-uppercase fw-bold"
                                    >
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default AdminView;
