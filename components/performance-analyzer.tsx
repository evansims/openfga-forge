"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, CheckCircle, Info, TrendingUp, Clock, Zap, Target } from "lucide-react"

interface PerformanceAnalyzerProps {
  model: any
  issues: any[]
}

export function PerformanceAnalyzer({ model, issues }: PerformanceAnalyzerProps) {
  const calculateComplexityScore = () => {
    let score = 0
    model.type_definitions.forEach((typeDef: any) => {
      score += Object.keys(typeDef.relations || {}).length * 2
      Object.values(typeDef.relations || {}).forEach((relation: any) => {
        if (relation.union) score += 3
        if (relation.intersection) score += 4
        if (relation.difference) score += 5
        if (relation.tupleToUserset) score += 6
      })
    })
    return Math.min(score, 100)
  }

  const getPerformanceMetrics = () => {
    const totalTypes = model.type_definitions.length
    const totalRelations = model.type_definitions.reduce(
      (acc: number, typeDef: any) => acc + Object.keys(typeDef.relations || {}).length,
      0,
    )
    const complexRelations = model.type_definitions.reduce(
      (acc: number, typeDef: any) =>
        acc +
        Object.values(typeDef.relations || {}).filter(
          (rel: any) => rel.union || rel.intersection || rel.difference || rel.tupleToUserset,
        ).length,
      0,
    )

    return { totalTypes, totalRelations, complexRelations }
  }

  const complexityScore = calculateComplexityScore()
  const metrics = getPerformanceMetrics()

  const getScoreColor = (score: number) => {
    if (score < 30) return "text-green-600"
    if (score < 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreLabel = (score: number) => {
    if (score < 30) return "Low Complexity"
    if (score < 60) return "Medium Complexity"
    return "High Complexity"
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Types</p>
                <p className="text-2xl font-bold">{metrics.totalTypes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Relations</p>
                <p className="text-2xl font-bold">{metrics.totalRelations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Complex Relations</p>
                <p className="text-2xl font-bold">{metrics.complexRelations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Complexity</p>
                <p className={`text-2xl font-bold ${getScoreColor(complexityScore)}`}>{complexityScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Complexity Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Complexity</span>
                <Badge variant={complexityScore < 30 ? "default" : complexityScore < 60 ? "secondary" : "destructive"}>
                  {getScoreLabel(complexityScore)}
                </Badge>
              </div>
              <Progress value={complexityScore} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-600">Low Impact (0-30%)</p>
                <p className="text-muted-foreground">Fast query resolution, minimal resource usage</p>
              </div>
              <div>
                <p className="font-medium text-yellow-600">Medium Impact (30-60%)</p>
                <p className="text-muted-foreground">Moderate query times, consider optimization</p>
              </div>
              <div>
                <p className="font-medium text-red-600">High Impact (60%+)</p>
                <p className="text-muted-foreground">Slow queries, optimization recommended</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Issues & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {issues.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>No performance issues detected. Your model looks optimized!</AlertDescription>
              </Alert>
            ) : (
              issues.map((issue, index) => (
                <Alert key={index} variant={issue.severity === "error" ? "destructive" : "default"}>
                  {issue.severity === "error" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">{issue.message}</p>
                      <p className="text-sm text-muted-foreground">{issue.suggestion}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">General Best Practices</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Keep relation hierarchies shallow (max 3-4 levels)</li>
                <li>Avoid circular references between types</li>
                <li>Use direct relations when possible instead of computed ones</li>
                <li>Consider caching for frequently accessed relations</li>
                <li>Monitor query performance in production</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Performance Tips</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Batch authorization checks when possible</li>
                <li>Use specific object types rather than generic ones</li>
                <li>Consider denormalizing complex permission structures</li>
                <li>Implement proper indexing strategies</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
