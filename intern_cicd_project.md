# Intern Project: Building a CI/CD Pipeline for the Availability Tracker

GitHub Link: https://github.com/ge0rgeK/TeamavailTest.git

---

## Project Overview

You will be working on a real application used to track team availability. This app is currently hosted on GCP and has been used internally for monitoring. Your task is to build a CI/CD pipeline to automate the lifecycle of the application from code quality checks to building and running it locally.

This project will simulate real-world DevOps tasks and workflows, giving you experience with common tools like Git, Docker, and Bash scripting.

---

## Objectives

- 🛠️ Build a CI/CD pipeline locally using Bash scripting.
- 🐳 Dockerize the application.
- ⚙️ Run the application and its dependencies using Docker Compose.
- ✅ Automate code linting and testing.
- 🚀 *(Optional)* Create an additional pipeline using GitHub Actions or Jenkins.
- 🌍 *(Optional)* Use Terraform to simulate infrastructure provisioning.

---

## Technologies You Will Use

| Area                   | Required Tools         | Optional Tools          |
| ---------------------- | ---------------------- | ----------------------- |
| Version Control        | Git                    | GitHub                  |
| Scripting              | Bash                   | Makefile                |
| Containerization       | Docker                 | Docker Compose          |
| CI/CD                  | Bash scripts           | GitHub Actions, Jenkins |
| Code Quality           | flake8, black (Python) | ESLint, prettier (JS)   |
| Testing                | pytest                 | unittest                |
| Infrastructure as Code | -                      | Terraform               |

---

## Project Tasks

1. **Set Up the Project**
   -  Clone the project repository.
   -  Create a `.gitignore` file if missing.
   -  Install the required dependencies locally.

1. **Write a Bash Script (`ci.sh`)**
   This script should:
   -  Run code formatting and linting.
   -  Run tests.
   -  Build a Docker image of the application.
   -  Start the application using Docker Compose.

1. **Dockerize the App**
   -  Write a `Dockerfile` to build the application image.
   -  Use best practices for image building (e.g., smaller base images, clean layers).

1. **Use Docker Compose**
   -  Create a `docker-compose.yml` file.
   -  Include the app and any required services like Redis or PostgreSQL.
   -  Configure volumes and ports properly.

1. **Validate and Document**
   -  Run your full pipeline locally to ensure it works.
   -  Create a `README.md` file that explains:
     -  How to run the app locally.
     -  How your pipeline works.
     -  What each part of your code and setup does.
	``
---

## Optional Extensions

- **GitHub Actions**
  -  Create a `.github/workflows/ci.yml` file to replicate your Bash pipeline in GitHub Actions.

- **Jenkins**
  -  Set up Jenkins locally using Docker or natively.
  -  Write a `Jenkinsfile` to mirror the Bash pipeline.

- **Terraform**
  -  Write a simple `main.tf` file to simulate infrastructure (e.g., using local or random resources).

---

## 📤 Deliverables

- 📝 `ci.sh` or Makefile
- 🐳 `Dockerfile`
- 📦 `docker-compose.yml`
- 📖 `README.md`
- ✨ *(Optional)* `.github/workflows/ci.yml` or `Jenkinsfile`
- 🌍 *(Optional)* Terraform files (`main.tf`, `outputs.tf`, etc.)

---

## 📊 Evaluation Criteria

| Area | Weight |
|------|--------|
| ✅ Functionality of CI Script | 30% |
| 🐳 Dockerization Quality | 20% |
| 🧪 Code Quality & Automation | 20% |
| 🌐 Optional Tools Integration | 20% |
| 📝 Documentation | 10% |

---
