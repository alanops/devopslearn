import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { ArrowLeft, HelpCircle, PlayCircle, RotateCw } from 'lucide-react'
import Link from 'next/link'

// Dynamically import terminal component to avoid SSR issues
const TerminalComponent = dynamic(() => import('@/components/Terminal'), { 
  ssr: false,
  loading: () => <div className="terminal h-96 flex items-center justify-center">Loading terminal...</div>
})

interface ScenarioData {
  id: string
  title: string
  description: string
  objective: string
  hints: string[]
  initialState: string
  successCriteria: string[]
}

// Mock scenario data - in production this would come from an API
const scenarios: Record<string, ScenarioData> = {
  'k8s-crashloop': {
    id: 'k8s-crashloop',
    title: 'Keycloak in CrashLoopBackOff',
    description: 'Your Keycloak pod is stuck in a CrashLoopBackOff state. The authentication service is down and users cannot log in.',
    objective: 'Get the Keycloak pod running successfully',
    hints: [
      'Check the pod logs for error messages',
      'Verify the database connection settings',
      'Check if required environment variables are set',
      'Look for resource limits that might be too low'
    ],
    initialState: 'Pod keycloak-0 is in CrashLoopBackOff state',
    successCriteria: [
      'Keycloak pod is in Running state',
      'Health check endpoint responds with 200',
      'No restart in the last 5 minutes'
    ]
  },
  'tf-drift': {
    id: 'tf-drift',
    title: 'Terraform State Drift',
    description: 'Someone manually modified AWS resources and now your Terraform state is out of sync with reality.',
    objective: 'Resolve the Terraform state drift without breaking production',
    hints: [
      'Run terraform plan to see the drift',
      'Use terraform refresh to update state',
      'Consider using terraform import for untracked resources',
      'Check for manual changes in AWS console'
    ],
    initialState: 'Terraform plan shows 5 resources to be destroyed and recreated',
    successCriteria: [
      'Terraform plan shows no changes',
      'All resources match desired state',
      'No production downtime occurred'
    ]
  }
}

export default function ScenarioPage() {
  const router = useRouter()
  const { id } = router.query
  const [showHint, setShowHint] = useState(false)
  const [currentHintIndex, setCurrentHintIndex] = useState(0)
  const [scenarioStarted, setScenarioStarted] = useState(false)

  const scenario = scenarios[id as string]

  if (!scenario) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Scenario not found</h1>
          <Link href="/" className="btn-primary">
            Back to scenarios
          </Link>
        </div>
      </div>
    )
  }

  const handleStart = () => {
    setScenarioStarted(true)
  }

  const handleReset = () => {
    setScenarioStarted(false)
    setCurrentHintIndex(0)
    setShowHint(false)
  }

  const handleNextHint = () => {
    if (currentHintIndex < scenario.hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="mr-4">
                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {scenario.title}
              </h1>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <RotateCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Scenario Description</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {scenario.description}
              </p>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Objective:</h3>
                <p className="text-gray-600 dark:text-gray-400">{scenario.objective}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Initial State:</h3>
                <p className="text-gray-600 dark:text-gray-400">{scenario.initialState}</p>
              </div>
            </div>

            {!scenarioStarted ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                <button
                  onClick={handleStart}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  <PlayCircle className="w-5 h-5" />
                  Start Scenario
                </button>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-lg shadow overflow-hidden">
                <TerminalComponent scenarioId={scenario.id} />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Success Criteria</h3>
              <ul className="space-y-2">
                {scenario.successCriteria.map((criteria, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-gray-600 dark:text-gray-400">{criteria}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Need Help?</h3>
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-devops-primary hover:text-blue-700"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
              
              {showHint && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Hint {currentHintIndex + 1} of {scenario.hints.length}:
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {scenario.hints[currentHintIndex]}
                    </p>
                  </div>
                  {currentHintIndex < scenario.hints.length - 1 && (
                    <button
                      onClick={handleNextHint}
                      className="text-sm text-devops-primary hover:text-blue-700"
                    >
                      Next hint →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}