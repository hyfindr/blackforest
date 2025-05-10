import React, { useEffect, useState } from "react";
import { Spinner, Table, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import "./ValidatedSuppliers.css";

const ValidatedSuppliers = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchResults = async () => {
        try {
            const res = await fetch("http://localhost:5000/validations");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setResults(data);
        } catch (error) {
            console.warn("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResults();
        const interval = setInterval(fetchResults, 10000);
        return () => clearInterval(interval);
    }, []);

    const formatDate = (dateStr) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString() + " " + date.toLocaleTimeString();
        } catch {
            return "-";
        }
    };

    const renderStatusBadge = (status) => {
        return (
            <span className={`status-pill ${status.toLowerCase()}`}>
                {status === "passed"
                    ? "Compliant"
                    : status === "failed"
                    ? "Not Compliant"
                    : "Validating"}
            </span>
        );
    };

    return (
        <div className="admin-wrapper container-fluid validated-wrapper">
            <h5 className="section-title mb-4">Validated Certificates</h5>

            {loading ? (
                <Spinner animation="border" variant="dark" />
            ) : results.length === 0 ? (
                <div className="custom-alert">
                    No validations found yet. Please check back later.
                </div>
            ) : (
                <Table
                    bordered
                    hover
                    responsive
                    className="validated-table align-middle"
                >
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((item) => (
                            <tr key={item.id}>
                                <td>{item.id}</td>
                                <td>{item.category_name}</td>
                                <td>{renderStatusBadge(item.status)}</td>
                                <td>{formatDate(item.date)}</td>
                                <td>
                                    {item.status !== "pending" ? (
                                        <Button
                                            variant="outline-dark"
                                            size="sm"
                                            className="rounded-0"
                                            onClick={() =>
                                                navigate(`/details/${item.id}`)
                                            }
                                        >
                                            <Eye size={16} className="me-1" />
                                            View
                                        </Button>
                                    ) : (
                                        <span className="text-muted small">
                                            -
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
};

export default ValidatedSuppliers;
