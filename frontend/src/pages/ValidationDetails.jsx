import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Table } from "react-bootstrap";

const originalChemicalData = [
    { element: "C", standard: "0.17-0.22", test: "0.19", compliant: true },
    { element: "Si", standard: "≤0.60", test: "0.44", compliant: true },
    { element: "Mn", standard: "0.80-1.20", test: "0.98", compliant: true },
    { element: "P+S", standard: "≤0.03", test: "0.04", compliant: false },
    { element: "S", standard: "≤0.015", test: "0.007", compliant: true },
    { element: "Cr", standard: "0.40-0.90", test: "0.63", compliant: true },
    { element: "Mo", standard: "0.40-0.70", test: "0.75", compliant: false },
    { element: "Ni", standard: "0.60-1.00", test: "0.82", compliant: true },
    { element: "Al", standard: "≤0.080", test: "0.038", compliant: true },
    { element: "V", standard: "≤0.05", test: "0.065", compliant: false },
    { element: "Cu", standard: "≤0.15", test: "0.20", compliant: false },
    { element: "N", standard: "≤0.013", test: "0.009", compliant: true },
    { element: "Nb", standard: "≤0.05", test: "0.002", compliant: true },
    { element: "CEV", standard: "≤0.68", test: "0.65", compliant: true },
];

const originalMechanicalData = [
    {
        property: "Yield Stress (N/mm²)",
        standard: "≥550",
        test: "568",
        compliant: true,
    },
    {
        property: "Tensile Strength (N/mm²)",
        standard: "650-800",
        test: "702",
        compliant: true,
    },
    {
        property: "Elongation (%)",
        standard: "≥15",
        test: "17.3",
        compliant: true,
    },
    {
        property: "Hardness (HB)",
        standard: "195-238",
        test: "247",
        compliant: false,
    },
    {
        property: "Impact Energy ISO-V @ -40°C (J)",
        standard: "≥27",
        test: "68, 65, 70",
        compliant: true,
    },
];

const ValidationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Eğer ID 12 ise: tüm testler geçti olarak göster
    const isOverrideAllPass = id === "12";

    const chemicalData = isOverrideAllPass
        ? originalChemicalData.map((row) => ({ ...row, compliant: true }))
        : originalChemicalData;

    const mechanicalData = isOverrideAllPass
        ? originalMechanicalData.map((row) => ({ ...row, compliant: true }))
        : originalMechanicalData;

    return (
        <div className="admin-wrapper container-fluid">
            <h4 className="mb-3 text-uppercase fw-bold">
                Certificate Details (ID: {id})
            </h4>

            <Button
                variant="secondary"
                className="mb-4 rounded-0"
                onClick={() => navigate(-1)}
            >
                ← Back
            </Button>

            {/* Chemical Composition */}
            <div className="table-responsive bg-white shadow-sm p-4 mb-5">
                <h6 className="text-uppercase fw-bold mb-3">
                    Chemical Composition
                </h6>
                <Table bordered hover responsive className="align-middle mb-0">
                    <thead className="table-light text-center">
                        <tr>
                            <th className="text-uppercase">Element</th>
                            <th className="text-uppercase">Standard</th>
                            <th className="text-uppercase">Test</th>
                            <th className="text-uppercase">Compliance</th>
                        </tr>
                    </thead>
                    <tbody className="text-center">
                        {chemicalData.map((row, index) => (
                            <tr key={index}>
                                <td>{row.element}</td>
                                <td>{row.standard}</td>
                                <td>{row.test}</td>
                                <td
                                    style={{
                                        color: row.compliant ? "green" : "red",
                                    }}
                                >
                                    {row.compliant ? "✔" : "✘"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* Mechanical Properties */}
            <div className="table-responsive bg-white shadow-sm p-4 mb-4">
                <h6 className="text-uppercase fw-bold mb-3">
                    Mechanical Properties
                </h6>
                <Table bordered hover responsive className="align-middle mb-0">
                    <thead className="table-light text-center">
                        <tr>
                            <th className="text-uppercase">Property</th>
                            <th className="text-uppercase">Standard</th>
                            <th className="text-uppercase">Test</th>
                            <th className="text-uppercase">Compliance</th>
                        </tr>
                    </thead>
                    <tbody className="text-center">
                        {mechanicalData.map((row, index) => (
                            <tr key={index}>
                                <td>{row.property}</td>
                                <td>{row.standard}</td>
                                <td>{row.test}</td>
                                <td
                                    style={{
                                        color: row.compliant ? "green" : "red",
                                    }}
                                >
                                    {row.compliant ? "✔" : "✘"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default ValidationDetails;
