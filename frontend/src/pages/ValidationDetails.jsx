import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spinner, Alert, Button } from "react-bootstrap";

const ValidationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch(
                    `http://localhost:5000/validations/${id}`
                );
                if (!res.ok) throw new Error("Failed to fetch details");
                const data = await res.json();
                setDetails(data);
            } catch (err) {
                console.error("Fetch error:", err);
                setError("Failed to load certificate details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    return (
        <div className="admin-wrapper container-fluid">
            <h4 className="mb-3">Certificate Details (ID: {id})</h4>

            <Button
                variant="secondary"
                className="mb-4 rounded-0"
                onClick={() => navigate(-1)}
            >
                ← Back
            </Button>

            {loading && <Spinner animation="border" variant="dark" />}

            {error && (
                <Alert variant="danger" className="mt-3">
                    {error}
                </Alert>
            )}

            {details && (
                <pre className="bg-light p-3 rounded-0">
                    {JSON.stringify(details, null, 2)}
                </pre>
            )}
        </div>
    );
};

export default ValidationDetails;
