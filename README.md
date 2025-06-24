# DevOps Learning Platform - Learn by Fixing Broken Things

🌐 **Live Demo**: [https://devopslearn.netlify.app/](https://devopslearn.netlify.app/)

A hands-on learning platform for DevOps engineers based on real-world troubleshooting scenarios. Inspired by the "debugging in public" philosophy, this platform provides broken infrastructure scenarios that users must diagnose and fix.

## ✨ **NEW: YouTube Thumbnail Resizer Tool**

We've added a professional **YouTube Thumbnail Resizer** to help content creators optimize their thumbnails:

🎯 **Try it now**: [https://devopslearn.netlify.app/tools/thumbnail-resizer](https://devopslearn.netlify.app/tools/thumbnail-resizer)

### Features:
- **Drag & drop upload** with support for JPG, PNG, WebP
- **YouTube-optimized presets**: HD (1280x720) and SD (640x360)
- **Smart compression** - automatically stays under 2MB
- **Custom dimensions** and quality control
- **Batch processing** for multiple images
- **Mobile-responsive** interface

## 🎯 Features

- **Interactive Terminal**: Browser-based terminal for hands-on practice
- **Real Scenarios**: Based on actual production issues and community suggestions
- **Progressive Hints**: Get help when stuck without spoiling the learning experience
- **Isolated Environments**: Each scenario runs in its own Docker container
- **Multiple Categories**: Kubernetes, CI/CD, Databases, Terraform, Monitoring, and Security

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Make (optional, for using Makefile commands)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/devopslearn.git
cd devopslearn
```

2. Install dependencies:
```bash
make install
# or manually:
npm install
cd src/server && npm install
```

3. Start the development environment:
```bash
make dev
# or manually:
docker-compose up -d
```

4. Access the platform:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 📚 Available Scenarios

### Kubernetes
- **Keycloak in CrashLoopBackOff**: Fix authentication service that won't start
- **DNS Resolution Failures**: Troubleshoot cluster networking issues
- **Istio Service Mesh Issues**: Debug service mesh configuration

### CI/CD
- **Jenkins to GitHub Actions Migration**: Complete a migration with broken configs
- **Secret Management Gone Wrong**: Fix exposed secrets and implement proper handling
- **Failed Production Deployment**: Recover from a failed deployment

### Database Recovery
- **RDS Instance Failure**: Handle AWS RDS failures
- **Database Corruption Recovery**: Recover from data corruption
- **Performance Bottleneck Detection**: Identify and fix slow queries

### Infrastructure (Terraform)
- **Terraform State Drift**: Reconcile state with actual resources
- **Accidental Resource Deletion**: Recover from accidental deletions
- **IAM Permission Issues**: Fix AWS permission problems

### Monitoring & Observability
- **Grafana Dashboard Creation**: Build effective monitoring dashboards
- **Prometheus Auto-discovery Fix**: Fix service discovery issues
- **Log Rotation Nightmare**: Handle massive log files

### Security & Secrets
- **Certificate Expiry Crisis**: Handle expired certificates
- **Exposed Secrets in Git**: Clean up and rotate exposed credentials
- **HashiCorp Vault Lockout**: Recover from Vault access issues

## 🛠️ Development

### Project Structure
```
devopslearn/
├── src/
│   ├── components/     # React components
│   ├── pages/         # Next.js pages
│   ├── server/        # WebSocket backend
│   └── styles/        # CSS styles
├── scenarios/         # Scenario configurations
│   ├── kubernetes/
│   ├── cicd/
│   ├── database/
│   └── ...
├── docker/           # Docker configurations
├── public/           # Static assets
└── tests/           # Test files
```

### Adding New Scenarios

1. Create scenario directory:
```bash
mkdir -p scenarios/category/scenario-name
```

2. Add scenario files:
- `Dockerfile`: Container configuration
- `setup.sh`: Scenario initialization script
- `manifests/`: Configuration files
- `solution/`: Solution files and guide

3. Register in frontend (`src/pages/index.tsx`)

4. Build scenario image:
```bash
docker build -t devopslearn/scenario-name:latest scenarios/category/scenario-name/
```

### Commands

```bash
make help          # Show all available commands
make dev           # Start development environment
make build         # Build all images
make test          # Run tests
make lint          # Run linting
make clean         # Clean up containers
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your scenario or feature
4. Submit a pull request

### Scenario Ideas Welcome!

We're always looking for new scenarios based on real-world problems. Submit your ideas via issues or pull requests.

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by the DevOps community's "learning by breaking things" philosophy
- Based on suggestions from r/devops community members
- Built with Next.js, TypeScript, Docker, and xterm.js