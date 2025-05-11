import React, { useState } from "react";
import { Table, Row, Col, Card, Form, Button } from "react-bootstrap";
import "./MaterialSpecs.css";

const initialFakeMaterial = {
    grade_name: "S355J2+N",
    chemical_properties: [
        { element: "C", min_value: "0.17", max_value: "0.22" },
        { element: "Mn", min_value: "1.00", max_value: "1.60" },
    ],
    mechanical_properties: [
        {
            property_name: "Yield Strength",
            min_value: "355",
            max_value: "-",
            unit: "MPa",
        },
        {
            property_name: "Elongation",
            min_value: "20",
            max_value: "-",
            unit: "%",
        },
    ],
};

const MaterialSpecs = () => {
    const [materials, setMaterials] = useState([initialFakeMaterial]);

    const [newChemical, setNewChemical] = useState({
        element: "",
        min_value: "",
        max_value: "",
    });

    const [newMechanical, setNewMechanical] = useState({
        property_name: "",
        min_value: "",
        max_value: "",
        unit: "",
    });

    const handleAddChemical = () => {
        if (!newChemical.element) return;
        const updated = [...materials];
        updated[0].chemical_properties.push(newChemical);
        setMaterials(updated);
        setNewChemical({ element: "", min_value: "", max_value: "" });
    };

    const handleDeleteChemical = (index) => {
        const updated = [...materials];
        updated[0].chemical_properties.splice(index, 1);
        setMaterials(updated);
    };

    const handleAddMechanical = () => {
        if (!newMechanical.property_name) return;
        const updated = [...materials];
        updated[0].mechanical_properties.push(newMechanical);
        setMaterials(updated);
        setNewMechanical({
            property_name: "",
            min_value: "",
            max_value: "",
            unit: "",
        });
    };

    const handleDeleteMechanical = (index) => {
        const updated = [...materials];
        updated[0].mechanical_properties.splice(index, 1);
        setMaterials(updated);
    };

    return (
        <div className="validated-wrapper">
            {materials.map((material, idx) => (
                <Card key={idx} className="mb-4 border-0 shadow-sm rounded-0">
                    <Card.Body>
                        <h5 className="section-title mb-4 text-uppercase">
                            Grade:{" "}
                            <span className="text-dark">
                                {material.grade_name}
                            </span>
                        </h5>

                        <Row>
                            {/* Chemical Properties */}
                            <Col xs={12} md={6}>
                                <h6 className="text-uppercase text-muted mb-2">
                                    Chemical Properties
                                </h6>
                                <Table
                                    bordered
                                    size="sm"
                                    className="spec-table"
                                >
                                    <thead className="table-light text-center">
                                        <tr>
                                            <th>Element</th>
                                            <th>Min</th>
                                            <th>Max</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {material.chemical_properties.map(
                                            (chem, i) => (
                                                <tr key={i}>
                                                    <td>{chem.element}</td>
                                                    <td>{chem.min_value}</td>
                                                    <td>{chem.max_value}</td>
                                                    <td className="text-center">
                                                        <Button
                                                            size="sm"
                                                            variant="outline-danger"
                                                            onClick={() =>
                                                                handleDeleteChemical(
                                                                    i
                                                                )
                                                            }
                                                        >
                                                            ✘
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                        <tr>
                                            <td>
                                                <Form.Control
                                                    size="sm"
                                                    placeholder="Element"
                                                    value={newChemical.element}
                                                    onChange={(e) =>
                                                        setNewChemical(
                                                            (prev) => ({
                                                                ...prev,
                                                                element:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    size="sm"
                                                    placeholder="Min"
                                                    value={
                                                        newChemical.min_value
                                                    }
                                                    onChange={(e) =>
                                                        setNewChemical(
                                                            (prev) => ({
                                                                ...prev,
                                                                min_value:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    size="sm"
                                                    placeholder="Max"
                                                    value={
                                                        newChemical.max_value
                                                    }
                                                    onChange={(e) =>
                                                        setNewChemical(
                                                            (prev) => ({
                                                                ...prev,
                                                                max_value:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="text-center">
                                                <Button
                                                    size="sm"
                                                    variant="outline-success"
                                                    onClick={handleAddChemical}
                                                >
                                                    ➕
                                                </Button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </Col>

                            {/* Mechanical Properties */}
                            <Col xs={12} md={6} className="mt-4 mt-md-0">
                                <h6 className="text-uppercase text-muted mb-2">
                                    Mechanical Properties
                                </h6>
                                <Table
                                    bordered
                                    size="sm"
                                    className="spec-table"
                                >
                                    <thead className="table-light text-center">
                                        <tr>
                                            <th>Property</th>
                                            <th>Min</th>
                                            <th>Max</th>
                                            <th>Unit</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {material.mechanical_properties.map(
                                            (mech, i) => (
                                                <tr key={i}>
                                                    <td>
                                                        {mech.property_name}
                                                    </td>
                                                    <td>{mech.min_value}</td>
                                                    <td>{mech.max_value}</td>
                                                    <td>{mech.unit}</td>
                                                    <td className="text-center">
                                                        <Button
                                                            size="sm"
                                                            variant="outline-danger"
                                                            onClick={() =>
                                                                handleDeleteMechanical(
                                                                    i
                                                                )
                                                            }
                                                        >
                                                            ✘
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                        <tr>
                                            <td>
                                                <Form.Control
                                                    size="sm"
                                                    placeholder="Property"
                                                    value={
                                                        newMechanical.property_name
                                                    }
                                                    onChange={(e) =>
                                                        setNewMechanical(
                                                            (prev) => ({
                                                                ...prev,
                                                                property_name:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    size="sm"
                                                    placeholder="Min"
                                                    value={
                                                        newMechanical.min_value
                                                    }
                                                    onChange={(e) =>
                                                        setNewMechanical(
                                                            (prev) => ({
                                                                ...prev,
                                                                min_value:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    size="sm"
                                                    placeholder="Max"
                                                    value={
                                                        newMechanical.max_value
                                                    }
                                                    onChange={(e) =>
                                                        setNewMechanical(
                                                            (prev) => ({
                                                                ...prev,
                                                                max_value:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td>
                                                <Form.Control
                                                    size="sm"
                                                    placeholder="Unit"
                                                    value={newMechanical.unit}
                                                    onChange={(e) =>
                                                        setNewMechanical(
                                                            (prev) => ({
                                                                ...prev,
                                                                unit: e.target
                                                                    .value,
                                                            })
                                                        )
                                                    }
                                                />
                                            </td>
                                            <td className="text-center">
                                                <Button
                                                    size="sm"
                                                    variant="outline-success"
                                                    onClick={
                                                        handleAddMechanical
                                                    }
                                                >
                                                    ➕
                                                </Button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
};

export default MaterialSpecs;
