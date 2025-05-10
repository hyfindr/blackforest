import React, { useState } from "react";
import { Button, Spinner, Alert } from "react-bootstrap";
import CertificateResult from "./CertificateResult";
import "./FileUpload.css";

const FileUpload = () => {
    const [files, setFiles] = useState([]); // file -> files
    const [uploading, setUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [certificateData, setCertificateData] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setStatusMessage(null);
        setCertificateData(null);
    };

    const handleUpload = async () => {
        if (!file) {
            setStatusMessage({
                type: "danger",
                text: "Please select a file first.",
            });
            return;
        }

        setUploading(true);
        setStatusMessage(null);

        try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            console.log("Uploading file:", file.name);

            // Dummy certificate data (to simulate backend response)
            const dummyData = {
                supplier: "ABC Supplies GmbH",
                certificateId: "CERT-2025-07",
                expiryDate: "2025-12-31",
                compliance: true,
                warnings: ["Slight deviation in tensile strength test"],
                missingFields: [],
            };

            setCertificateData(dummyData);
            setStatusMessage({
                type: "success",
                text: "File uploaded successfully!",
            });
        } catch (error) {
            setStatusMessage({
                type: "danger",
                text: "Upload failed. Please try again.",
            });
        } finally {
            setUploading(false);
            setFile(null);
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

            <Button
                className="category-btn active btn btn-custom-selected"
                onClick={handleUpload}
                disabled={uploading}
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
                        Uploading...
                    </>
                ) : (
                    "Upload Document"
                )}
            </Button>

            {statusMessage && (
                <Alert className="mt-3" variant={statusMessage.type}>
                    {statusMessage.text}
                </Alert>
            )}

            {certificateData && <CertificateResult data={certificateData} />}
        </div>
    );
};

export default FileUpload;
