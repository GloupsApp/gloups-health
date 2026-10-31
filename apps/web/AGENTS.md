# Web conventions

- Inspect the workspace manifest before selecting framework conventions or commands. This directory has no `package.json`; do not assume a web framework or introduce one unless the task includes building the web application.
- Use shared public contracts and UI exports when adding consumers. Keep authentication and business state in the application rather than shared presentation primitives.
- When creating a runnable workspace, define its build and validation scripts and update this file with the resulting conventions.

Report unavailable web checks explicitly; do not substitute mobile or documentation builds as evidence of web behavior.
