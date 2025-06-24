import { useState } from 'react'
import Link from 'next/link'
import { Terminal, Database, Cloud, GitBranch, Activity, Shield, Image } from 'lucide-react'

const scenarioCategories = [
  {
    id: 'kubernetes',
    title: 'Kubernetes Chaos',
    icon: Cloud,
    description: 'Fix CrashLoopBackOff, networking issues, and more',
    scenarios: [
      { id: 'k8s-crashloop', title: 'Keycloak in CrashLoopBackOff', difficulty: 'medium' },
      { id: 'k8s-dns', title: 'DNS Resolution Failures', difficulty: 'hard' },
      { id: 'k8s-istio', title: 'Istio Service Mesh Issues', difficulty: 'hard' },
    ]
  },
  {
    id: 'cicd',
    title: 'CI/CD Disasters',
    icon: GitBranch,
    description: 'Debug broken pipelines and deployment failures',
    scenarios: [
      { id: 'jenkins-to-gha', title: 'Jenkins to GitHub Actions Migration', difficulty: 'medium' },
      { id: 'pipeline-secrets', title: 'Secret Management Gone Wrong', difficulty: 'easy' },
      { id: 'failed-deploy', title: 'Failed Production Deployment', difficulty: 'hard' },
    ]
  },
  {
    id: 'database',
    title: 'Database Recovery',
    icon: Database,
    description: 'Handle RDS failures, corruption, and performance issues',
    scenarios: [
      { id: 'rds-failure', title: 'RDS Instance Failure', difficulty: 'hard' },
      { id: 'db-corruption', title: 'Database Corruption Recovery', difficulty: 'hard' },
      { id: 'slow-queries', title: 'Performance Bottleneck Detection', difficulty: 'medium' },
    ]
  },
  {
    id: 'terraform',
    title: 'Infrastructure Issues',
    icon: Terminal,
    description: 'Fix Terraform drifts and AWS misconfigurations',
    scenarios: [
      { id: 'tf-drift', title: 'Terraform State Drift', difficulty: 'medium' },
      { id: 'tf-destroy', title: 'Accidental Resource Deletion', difficulty: 'easy' },
      { id: 'aws-iam', title: 'IAM Permission Issues', difficulty: 'medium' },
    ]
  },
  {
    id: 'monitoring',
    title: 'Monitoring & Observability',
    icon: Activity,
    description: 'Set up Grafana, fix Prometheus configs',
    scenarios: [
      { id: 'grafana-setup', title: 'Grafana Dashboard Creation', difficulty: 'easy' },
      { id: 'prom-discovery', title: 'Prometheus Auto-discovery Fix', difficulty: 'medium' },
      { id: 'log-rotation', title: 'Log Rotation Nightmare', difficulty: 'easy' },
    ]
  },
  {
    id: 'security',
    title: 'Security & Secrets',
    icon: Shield,
    description: 'Certificate management and secret handling',
    scenarios: [
      { id: 'cert-expiry', title: 'Certificate Expiry Crisis', difficulty: 'medium' },
      { id: 'secret-leak', title: 'Exposed Secrets in Git', difficulty: 'easy' },
      { id: 'vault-locked', title: 'HashiCorp Vault Lockout', difficulty: 'hard' },
    ]
  },
]

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            DevOps Dojo - Learn by Fixing Broken Things
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Real-world scenarios, real errors, real learning
          </p>
          <div className="mt-4">
            <Link
              href="/tools/thumbnail-resizer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              <Image className="w-4 h-4 mr-2" />
              YouTube Thumbnail Resizer
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarioCategories.map((category) => {
            const Icon = category.icon
            return (
              <div
                key={category.id}
                className="scenario-card cursor-pointer"
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              >
                <div className="flex items-center mb-4">
                  <Icon className="w-8 h-8 text-devops-primary mr-3" />
                  <h2 className="text-xl font-semibold">{category.title}</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {category.description}
                </p>
                
                {selectedCategory === category.id && (
                  <div className="mt-4 space-y-2">
                    {category.scenarios.map((scenario) => (
                      <Link
                        key={scenario.id}
                        href={`/scenario/${scenario.id}`}
                        className="block p-3 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{scenario.title}</span>
                          <span className={`text-sm px-2 py-1 rounded ${
                            scenario.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            scenario.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {scenario.difficulty}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {category.scenarios.length} scenarios available
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}