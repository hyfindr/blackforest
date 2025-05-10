import React, { useEffect, useState } from "react";
import { Table, Spinner, Alert, Row, Col, Card } from "react-bootstrap";
import "./MaterialSpecs.css";

const MaterialSpecs = ({ categoryId }) => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!categoryId) return;

        const fetchSpecs = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await fetch();
                // `http://localhost:5000/category/${categoryId}`
                if (!res.ok) throw new Error("Failed to fetch specs.");
                const data = await res.json();
                setMaterials(data.materials || []);
            } catch (err) {
                setError(
                    "Failed to fetch specs. Please check your connection."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchSpecs();
    }, [categoryId]);

    if (loading) return <Spinner animation="border" variant="dark" />;
    if (error)
        return (
            <Alert variant="danger" className="mt-3">
                {error}
            </Alert>
        );
    if (materials.length === 0) {
        return (
            <p className="mt-4 text-muted">
                No material specs found for this category.
            </p>
        );
    }

    return (
        <div className="validated-wrapper">
            {materials.map((material, idx) => (
                <Card key={idx} className="mb-4 border-0 shadow-sm rounded-0">
                    <Card.Body>
                        <h5 className="section-title mb-3">
                            Grade:{" "}
                            <span className="text-dark">
                                {material.grade_name}
                            </span>
                        </h5>

                        <Row>
                            <Col xs={12} md={6}>
                                <h6 className="text-uppercase text-muted mb-2">
                                    Chemical Properties
                                </h6>
                                <div className="table-responsive">
                                    <Table
                                        bordered
                                        size="sm"
                                        className="spec-table"
                                    >
                                        <thead className="table-light">
                                            <tr>
                                                <th>Element</th>
                                                <th>Min</th>
                                                <th>Max</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {material.chemical_properties.map(
                                                (chem, i) => (
                                                    <tr key={i}>
                                                        <td>{chem.element}</td>
                                                        <td>
                                                            {chem.min_value ??
                                                                "-"}
                                                        </td>
                                                        <td>
                                                            {chem.max_value ??
                                                                "-"}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Col>

                            <Col xs={12} md={6} className="mt-4 mt-md-0">
                                <h6 className="text-uppercase text-muted mb-2">
                                    Mechanical Properties
                                </h6>
                                <div className="table-responsive">
                                    <Table
                                        bordered
                                        size="sm"
                                        className="spec-table"
                                    >
                                        <thead className="table-light">
                                            <tr>
                                                <th>Property</th>
                                                <th>Min</th>
                                                <th>Max</th>
                                                <th>Unit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {material.mechanical_properties.map(
                                                (mech, i) => (
                                                    <tr key={i}>
                                                        <td>
                                                            {mech.property_name}
                                                        </td>
                                                        <td>
                                                            {mech.min_value ??
                                                                "-"}
                                                        </td>
                                                        <td>
                                                            {mech.max_value ??
                                                                "-"}
                                                        </td>
                                                        <td>{mech.unit}</td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
};

export default MaterialSpecs;
