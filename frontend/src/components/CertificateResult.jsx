import React from "react";
import { Card, Badge } from "react-bootstrap";
import "./CertificateResult.css";

const CertificateResult = ({ data }) => {
    const {
        supplier,
        certificateId,
        expiryDate,
        compliance,
        warnings,
        missingFields,
    } = data;

    return (
        <Card className="certificate-card mt-4">
            <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
                <span className="text-uppercase fw-bold">
                    Certificate Validation Result
                </span>
                <Badge
                    bg={compliance ? "success" : "danger"}
                    className="result-badge"
                >
                    {compliance ? "Compliant" : "Non-Compliant"}
                </Badge>
            </Card.Header>

            <Card.Body>
                <p>
                    <strong>Supplier:</strong> {supplier}
                </p>
                <p>
                    <strong>Certificate ID:</strong> {certificateId}
                </p>
                <p>
                    <strong>Expiry Date:</strong> {expiryDate}
                </p>

                {warnings?.length > 0 && (
                    <div className="mt-3">
                        <strong>Warnings:</strong>
                        <ul>
                            {warnings.map((w, idx) => (
                                <li key={idx}>{w}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {missingFields?.length > 0 && (
                    <div className="mt-3">
                        <strong>Missing Fields:</strong>
                        <ul>
                            {missingFields.map((f, idx) => (
                                <li key={idx}>{f}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default CertificateResult;
