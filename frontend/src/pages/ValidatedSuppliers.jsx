import React, { useEffect, useState } from "react";
import { Spinner, Table, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import Select from "react-select";
import "./ValidatedSuppliers.css";

const ValidatedSuppliers = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
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

    const statusOptions = [
        { value: "all", label: "All" },
        { value: "passed", label: "Compliant" },
        { value: "failed", label: "Not Compliant" },
        { value: "pending", label: "Validating" },
    ];

    const filteredResults = results.filter((item) => {
        const matchSearch =
            item.certificate_name
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
            item.category_name?.toLowerCase().includes(search.toLowerCase());

        const matchStatus =
            statusFilter === "all" || item.status === statusFilter;

        return matchSearch && matchStatus;
    });

    return (
        <div className="admin-wrapper container-fluid validated-wrapper">
            <h5 className="section-title mb-4">Validated Certificates</h5>

            {loading ? (
                <Spinner animation="border" variant="dark" />
            ) : (
                <>
                    <div className="d-flex flex-wrap align-items-center mb-3 gap-3">
                        <input
                            type="text"
                            placeholder="Search by certificate or category..."
                            className="form-control search-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Select
                            options={statusOptions}
                            defaultValue={statusOptions[0]}
                            onChange={(selected) =>
                                setStatusFilter(selected.value)
                            }
                            className="react-select-container"
                            classNamePrefix="react-select"
                            theme={(theme) => ({
                                ...theme,
                                borderRadius: 0,
                                colors: {
                                    ...theme.colors,
                                    primary: "#e0ac00", // selected
                                    primary25: "#fff8dc", // hover
                                    neutral0: "#ffffff",
                                    neutral20: "#ced4da",
                                    neutral80: "#000000",
                                },
                            })}
                        />
                    </div>

                    <Table
                        bordered
                        hover
                        responsive
                        className="validated-table align-middle"
                    >
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Certificate</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResults.length > 0 ? (
                                filteredResults.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.id}</td>
                                        <td>{item.certificate_name || "-"}</td>
                                        <td>{item.category_name}</td>
                                        <td>
                                            {renderStatusBadge(item.status)}
                                        </td>
                                        <td>{formatDate(item.date)}</td>
                                        <td>
                                            {item.status !== "pending" ? (
                                                <Button
                                                    variant="outline-dark"
                                                    size="sm"
                                                    className="rounded-0"
                                                    onClick={() =>
                                                        navigate(
                                                            `/details/${item.id}`
                                                        )
                                                    }
                                                >
                                                    <Eye
                                                        size={16}
                                                        className="me-1"
                                                    />
                                                    View
                                                </Button>
                                            ) : (
                                                <span className="text-muted small">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="text-center text-muted py-4"
                                    >
                                        No matching results.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </>
            )}
        </div>
    );
};

export default ValidatedSuppliers;
