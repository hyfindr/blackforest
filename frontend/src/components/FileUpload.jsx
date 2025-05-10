import React, { useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import "./FileUpload.css";

const FileUpload = () => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
        setStatusMessage(null);
    };

    const handleValidate = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setStatusMessage(null);

        try {
            const formData = new FormData();
            files.forEach((file) => formData.append("file[]", file));

            const res = await fetch("http://localhost:5000/upload", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Validation failed");

            const result = await res.json();

            setStatusMessage({
                type: "success",
                text:
                    result.message ||
                    `${files.length} file(s) sent for validation.`,
            });
        } catch (err) {
            setStatusMessage({
                type: "danger",
                text: "Validation failed. Please try again.",
            });
        } finally {
            setUploading(false);
            setFiles([]); // optionally clear after upload
        }
    };

    return (
        <div className="file-upload-wrapper container">
            <h5 className="section-title">Upload Supplier Certificate</h5>

            <input
                type="file"
                accept="application/pdf"
                className="form-control custom-file-input mb-3"
                onChange={handleFileChange}
                multiple
            />

            {files.length > 0 && (
                <ul className="mb-3 small text-muted ps-3">
                    {files.map((file, index) => (
                        <li key={index}>{file.name}</li>
                    ))}
                </ul>
            )}

            <Button
                className="btn btn-custom-selected"
                onClick={handleValidate}
                disabled={files.length === 0 || uploading}
            >
                {uploading ? (
                    <>
                        <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2 text-dark"
                        />
                        Validating...
                    </>
                ) : (
                    "Validate"
                )}
            </Button>

            {statusMessage && (
                <Alert className="mt-3" variant={statusMessage.type}>
                    {statusMessage.text}
                </Alert>
            )}
        </div>
    );
};

export default FileUpload;
