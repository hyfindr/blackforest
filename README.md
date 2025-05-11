# AI Supplier Certificate Validator

**Solution by the Hyfindr Team for the Liebherr Challenge**

## Overview

This project provides an AI-driven solution to validate supplier conformity certificates efficiently and accurately. It replaces the current manual, error-prone processes with an automated system that uses OCR and LLM technologies to extract, validate, and analyze certificate data.

## Problem Statement

Validating supplier certificates is currently manual and inefficient, affecting compliance and strategic decisions. This project aims to automate the process using AI, improving speed, accuracy, and reliability.

## Goals

- Design a user-friendly web interface to:
  - Upload supplier certificates (PDF)
  - Select product categories
  - Trigger validation
  - Check validation result and validation history
  - See chemical and mechanical properties for each material in category
- Extract text and validate certificate data using AI models
- Compare values against predefined compliance requirements
- Store validation history in a centralized database


## Tech Stack

| Layer       | Technology             |
|-------------|------------------------|
| AI Model    | OpenAI GPT-4 Turbo via OpenRouter |
| OCR & Parsing | LLamaParse API |
| Frontend    | React + Vite + Bootstrap |
| Backend     | Flask (Python)         |
| Database    | MySQL                  |

![image](https://github.com/user-attachments/assets/71a75acf-6374-4a82-8605-860f47adef17)

## Data & Resources

- Supplier certificates in PDF format
- Compliance requirement database


## Project Structure



```plaintext
project-root/
│
├── frontend/                             # Frontend client-side application 
│   ├── public/                          
│   └── src/                              
│       ├── assets/                       
│       │   ├── logo_liebherr.svg         # Liebherr logo used in UI
│       │   └── react.svg                 
│       ├── components/                   # Reusable UI components
│       │   ├── CategorySelector.jsx/.css # Buttons for certificate category selection
│       │   ├── CertificateResult.jsx/.css# Displays validation results
│       │   ├── FileUpload.jsx/.css       # Handles PDF uploads
│       │   ├── Header.jsx/.css           
│       │   ├── MaterialSpecs.jsx/.css    # Shows material-specific info from norms
│       │   └── Sidebar.jsx/.css          
│       ├── pages/                        
│       │   ├── AdminView.jsx/.css        # Admin interface to manage validations
│       │   ├── UserView.jsx              # Supplier/user-specific view
│       │   ├── ValidatedSuppliers.jsx/.css # Table/list of validated suppliers
│       │   └── ValidationDetails.jsx     # Detailed view of certificate validation
│       ├── App.jsx/.css                 
│       ├── index.css                    
│       └── main.jsx                      
│
├── backend/                              # Flask backend service for APIs and logic
│   ├── uploads/                          # Directory for storing uploaded certificate files
│   ├── .dockerignore                    
│   ├── .env.example                      # Template for environment variables
│   ├── .gitignore                       
│   ├── api.py                            # Main API route definitions
│   ├── Dockerfile                       
│   ├── flask.log                         
│   ├── pdf_parser.py                     # Extracts and processes text from PDFs uding LlamaParse
│   ├── requirements.txt                  # Backend Python dependencies
│   └── validate.py                       # Compliance checking logic for extracted data
│
├── .gitignore                            # Root-level ignore rules for both frontend and backend
└── README.md                             # Project documentation
```


## Success Criteria

- We reached high accuracy in data extraction and validation
- Reduction in manual processing time
- Scalability for document volume growth
- Enhanced process compliance and robustness

## Key Considerations

- Adaptability to diverse certificate formats
- Compliance with data privacy regulations

---

Built by the Hyfindr Team
