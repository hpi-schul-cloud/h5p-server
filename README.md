# H5P Server

This project provides an H5P content server with integrated S3 storage, MongoDB, RabbitMQ, and API endpoints for H5P content management and delivery. It is designed for secure, scalable environments and supports integration with external services.

## Features

- H5P Content Upload & Download: Manage H5P content and libraries.
- S3 Storage Integration: Store content and libraries in S3-compatible storage.
- Authorization: Access is controlled via external APIs.
- Logging: Detailed logging for debugging and auditing.
- RabbitMQ Integration: For asynchronous processing and notifications.
- MongoDB Support: Stores metadata and configuration.
- Modular Apps: Includes H5P Editor, Consumer, and Library Management apps.

## Environment Variables

Configuration is managed via environment files (e.g., `.env.development`). Key variables include:

| Variable                                     | Description                             |
| -------------------------------------------- | --------------------------------------- |
| LOGGER_LOG_LEVEL                             | Logging level (e.g., debug, info, warn) |
| H5P_EDITOR\_\_S3_ENDPOINT                    | S3 endpoint for H5P Editor              |
| H5P_EDITOR\_\_S3_REGION                      | S3 region                               |
| H5P_EDITOR\_\_S3_ACCESS_KEY_ID               | S3 access key for content               |
| H5P_EDITOR\_\_S3_SECRET_ACCESS_KEY           | S3 secret key for content               |
| H5P_EDITOR\_\_S3_BUCKET_CONTENT              | S3 bucket for H5P content               |
| H5P_EDITOR\_\_S3_BUCKET_LIBRARIES            | S3 bucket for H5P libraries             |
| H5P_EDITOR\_\_LIBRARIES_S3_ACCESS_KEY_ID     | S3 access key for libraries             |
| H5P_EDITOR\_\_LIBRARIES_S3_SECRET_ACCESS_KEY | S3 secret key for libraries             |
| RABBITMQ_URI                                 | RabbitMQ connection URI                 |
| DB_URL                                       | MongoDB connection URI                  |
| DB_ENSURE_INDEXES                            | Ensure MongoDB indexes                  |
| API_HOST                                     | Base URL for Authorization API          |
| CORE_INCOMING_REQUEST_TIMEOUT_MS             | Core service request timeout (ms)       |

## Getting Started

### Prerequisites

- Node.js (v24 recommended)
- npm (>=9)
- MongoDB
- RabbitMQ
- S3-compatible storage (e.g., AWS S3, MinIO)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/hpi-schul-cloud/h5p-server.git
   cd h5p-server
   ```
2. Install dependencies:
   ```sh
   npm ci --ignore-scripts
   ```
3. Configure environment:
   - Copy `.env.development` and adjust values as needed.
4. Start the service (example for H5P Editor):
   ```sh
   npm run start:h5p:dev
   ```

### Running Tests

Run all tests:

```sh
npm run test
```

## Project Structure

- `src/` - Main source code
  - `apps/` - Application entry points (H5P Editor, Consumer, Library Management)
  - `infra/` - Infrastructure (S3 client, authorization, configuration, etc.)
  - `modules/` - Domain modules
  - `shared/` - Shared utilities and types
  - `testing/` - Testing utilities and mocks
- `scripts/` - Utility scripts for H5P management
- `ansible/` - Deployment and configuration management

## Additional Links

- [Documentation](https://documentation.dbildungscloud.dev/docs/category/h5p)
- [Repository](https://github.com/hpi-schul-cloud/h5p-server)
- [Issues](https://github.com/hpi-schul-cloud/h5p-server/issues)
- [Pull Requests](https://github.com/hpi-schul-cloud/h5p-server/pulls)
