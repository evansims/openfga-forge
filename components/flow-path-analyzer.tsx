"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, CheckCircle, XCircle, Clock, Info } from "lucide-react"

interface FlowPathAnalyzerProps {
  model: any
  selectedType: string
  selectedRelation: string
}

interface EvaluationStep {
  id: string
  type: "check" | "operation" | "lookup" | "result"
  description: string
  input: string
  output: string
  status: "pending" | "success" | "failure" | "processing"
  duration?: number
  details?: string
}

export function FlowPathAnalyzer({ model, selectedType, selectedRelation }: FlowPathAnalyzerProps) {
  const [testUser, setTestUser] = useState("")
  const [testObject, setTestObject] = useState("")
  const [evaluationSteps, setEvaluationSteps] = useState<EvaluationStep[]>([])
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [finalResult, setFinalResult] = useState<"granted" | "denied" | null>(null)

  const simulateEvaluation = async () => {
    if (!testUser || !testObject) return

    setIsEvaluating(true)
    setEvaluationSteps([])
    setFinalResult(null)

    const typeDef = model.type_definitions.find((t: any) => t.type === selectedType)
    if (!typeDef || !typeDef.relations[selectedRelation]) {
      setIsEvaluating(false)
      return
    }

    const relation = typeDef.relations[selectedRelation]
    const steps: EvaluationStep[] = []
    let stepId = 0

    const addStep = (
      type: EvaluationStep["type"],
      description: string,
      input: string,
      output: string,
      status: EvaluationStep["status"] = "pending",
      details?: string,
    ) => {
      const step: EvaluationStep = {
        id: `step_${stepId++}`,
        type,
        description,
        input,
        output,
        status,
        duration: Math.random() * 50 + 10, // Simulate timing
        details,
      }
      steps.push(step)
      return step
    }

    // Simulate the evaluation process
    const evaluateRelation = async (relationData: any, depth = 0): Promise<boolean> => {
      await new Promise((resolve) => setTimeout(resolve, 100)) // Simulate processing time

      if (relationData.this) {
        const step = addStep(
          "check",
          "Direct Assignment Check",
          `user:${testUser}`,
          "Checking direct tuple assignment",
          "processing",
          "Looking for direct relationship tuple in the database",
        )

        // Simulate database lookup
        await new Promise((resolve) => setTimeout(resolve, 200))

        // Random result for demo
        const hasDirectAssignment = Math.random() > 0.5
        step.status = hasDirectAssignment ? "success" : "failure"
        step.output = hasDirectAssignment ? "Direct assignment found" : "No direct assignment"

        setEvaluationSteps([...steps])
        return hasDirectAssignment
      }

      if (relationData.union) {
        const step = addStep(
          "operation",
          "Union Operation",
          "Multiple child relations",
          "Evaluating OR logic",
          "processing",
          "Checking if ANY child relation is true",
        )

        const children = relationData.union.child || []
        let anyTrue = false

        for (let i = 0; i < children.length; i++) {
          const childStep = addStep(
            "check",
            `Union Child ${i + 1}`,
            `Child relation ${i + 1}`,
            "Evaluating child",
            "processing",
          )

          const childResult = await evaluateRelation(children[i], depth + 1)
          childStep.status = childResult ? "success" : "failure"
          childStep.output = childResult ? "Child relation true" : "Child relation false"

          if (childResult) {
            anyTrue = true
            // In union, we can short-circuit on first true
            break
          }
        }

        step.status = anyTrue ? "success" : "failure"
        step.output = anyTrue ? "Union result: GRANTED" : "Union result: DENIED"

        setEvaluationSteps([...steps])
        return anyTrue
      }

      if (relationData.intersection) {
        const step = addStep(
          "operation",
          "Intersection Operation",
          "Multiple child relations",
          "Evaluating AND logic",
          "processing",
          "Checking if ALL child relations are true",
        )

        const children = relationData.intersection.child || []
        let allTrue = true

        for (let i = 0; i < children.length; i++) {
          const childStep = addStep(
            "check",
            `Intersection Child ${i + 1}`,
            `Child relation ${i + 1}`,
            "Evaluating child",
            "processing",
          )

          const childResult = await evaluateRelation(children[i], depth + 1)
          childStep.status = childResult ? "success" : "failure"
          childStep.output = childResult ? "Child relation true" : "Child relation false"

          if (!childResult) {
            allTrue = false
            // In intersection, we can short-circuit on first false
            break
          }
        }

        step.status = allTrue ? "success" : "failure"
        step.output = allTrue ? "Intersection result: GRANTED" : "Intersection result: DENIED"

        setEvaluationSteps([...steps])
        return allTrue
      }

      if (relationData.computedUserset) {
        const targetRelation = relationData.computedUserset.relation
        const targetObject = relationData.computedUserset.object || selectedType

        const step = addStep(
          "lookup",
          "Computed Userset Lookup",
          `${targetObject}.${targetRelation}`,
          "Looking up computed relation",
          "processing",
          `Recursively checking ${targetObject}.${targetRelation} for user ${testUser}`,
        )

        // Simulate recursive lookup
        await new Promise((resolve) => setTimeout(resolve, 150))

        const computedResult = Math.random() > 0.4
        step.status = computedResult ? "success" : "failure"
        step.output = computedResult ? "Computed relation found" : "Computed relation not found"

        setEvaluationSteps([...steps])
        return computedResult
      }

      // Default case
      const step = addStep(
        "check",
        "Unknown Relation Type",
        "Unknown",
        "Cannot evaluate",
        "failure",
        "Relation type not recognized",
      )

      setEvaluationSteps([...steps])
      return false
    }

    // Start evaluation
    const initialStep = addStep(
      "check",
      "Authorization Check Started",
      `${testUser} → ${selectedType}:${testObject}#${selectedRelation}`,
      "Initializing evaluation",
      "processing",
      `Checking if user "${testUser}" has "${selectedRelation}" permission on ${selectedType} "${testObject}"`,
    )

    setEvaluationSteps([...steps])

    try {
      const result = await evaluateRelation(relation)

      initialStep.status = "success"
      initialStep.output = "Evaluation completed"

      const finalStep = addStep(
        "result",
        "Final Result",
        "Evaluation complete",
        result ? "ACCESS GRANTED" : "ACCESS DENIED",
        result ? "success" : "failure",
        result ? "User has the required permission" : "User does not have the required permission",
      )

      setFinalResult(result ? "granted" : "denied")
      setEvaluationSteps([...steps])
    } catch (error) {
      initialStep.status = "failure"
      initialStep.output = "Evaluation failed"
      setEvaluationSteps([...steps])
    }

    setIsEvaluating(false)
  }

  const getStepIcon = (step: EvaluationStep) => {
    switch (step.status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "failure":
        return <XCircle className="w-4 h-4 text-red-500" />
      case "processing":
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStepColor = (step: EvaluationStep) => {
    switch (step.status) {
      case "success":
        return "border-green-200 bg-green-50"
      case "failure":
        return "border-red-200 bg-red-50"
      case "processing":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Authorization Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">User ID</label>
                <Input placeholder="e.g., user:alice" value={testUser} onChange={(e) => setTestUser(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Object ID</label>
                <Input
                  placeholder="e.g., document:readme"
                  value={testObject}
                  onChange={(e) => setTestObject(e.target.value)}
                />
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Testing: Can <strong>{testUser || "user"}</strong> perform <strong>{selectedRelation}</strong> on{" "}
                <strong>
                  {selectedType}:{testObject || "object"}
                </strong>
                ?
              </AlertDescription>
            </Alert>

            <Button onClick={simulateEvaluation} disabled={!testUser || !testObject || isEvaluating} className="w-full">
              <Play className="w-4 h-4 mr-2" />
              {isEvaluating ? "Evaluating..." : "Run Authorization Check"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Steps */}
      {evaluationSteps.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Evaluation Steps</CardTitle>
              {finalResult && (
                <Badge variant={finalResult === "granted" ? "default" : "destructive"} className="text-sm">
                  {finalResult === "granted" ? "ACCESS GRANTED" : "ACCESS DENIED"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evaluationSteps.map((step, index) => (
                <div key={step.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white">
                      {getStepIcon(step)}
                    </div>
                    {index < evaluationSteps.length - 1 && <div className="w-px h-8 bg-gray-200 mt-2"></div>}
                  </div>

                  <div className={`flex-1 p-4 rounded-lg border ${getStepColor(step)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{step.description}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {step.type}
                        </Badge>
                        {step.duration && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(step.duration)}ms
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Input:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">{step.input}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Output:</span>
                        <span
                          className={
                            step.status === "success"
                              ? "text-green-700"
                              : step.status === "failure"
                                ? "text-red-700"
                                : "text-gray-700"
                          }
                        >
                          {step.output}
                        </span>
                      </div>
                      {step.details && (
                        <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">{step.details}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      {evaluationSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{evaluationSteps.length}</div>
                <div className="text-sm text-gray-600">Total Steps</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {evaluationSteps.filter((s) => s.status === "success").length}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {evaluationSteps.filter((s) => s.status === "failure").length}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(evaluationSteps.reduce((sum, step) => sum + (step.duration || 0), 0))}ms
                </div>
                <div className="text-sm text-gray-600">Total Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
