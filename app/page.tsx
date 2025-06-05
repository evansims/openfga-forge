"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Upload, Play, AlertTriangle, CheckCircle, Info, Eye, Code, GitBranch } from "lucide-react"
import { VisualEditor } from "@/components/visual-editor"
import { DSLEditor } from "@/components/dsl-editor"
import { PerformanceAnalyzer } from "@/components/performance-analyzer"
import { EntityPanel } from "@/components/entity-panel"
import { FlowDiagramViewer } from "@/components/flow-diagram-viewer"

interface OpenFGAModel {
  schema_version: string
  type_definitions: TypeDefinition[]
}

interface TypeDefinition {
  type: string
  relations: Record<string, Relation>
  metadata?: {
    module?: string
    source_info?: {
      file?: string
    }
  }
}

interface Relation {
  this?: Record<string, any>
  union?: Record<string, any>
  intersection?: Record<string, any>
  difference?: Record<string, any>
  computedUserset?: {
    object?: string
    relation?: string
  }
  tupleToUserset?: {
    tupleset: {
      object?: string
      relation?: string
    }
    computedUserset: {
      object?: string
      relation?: string
    }
  }
}

const defaultModel: OpenFGAModel = {
  schema_version: "1.1",
  type_definitions: [
    {
      type: "user",
      relations: {},
    },
    {
      type: "document",
      relations: {
        owner: {
          this: {},
        },
        viewer: {
          union: {
            child: [
              {
                this: {},
              },
              {
                computedUserset: {
                  object: "",
                  relation: "owner",
                },
              },
            ],
          },
        },
        editor: {
          union: {
            child: [
              {
                this: {},
              },
              {
                computedUserset: {
                  object: "",
                  relation: "owner",
                },
              },
            ],
          },
        },
      },
    },
  ],
}

export default function OpenFGAModelingTool() {
  const [model, setModel] = useState<OpenFGAModel>(defaultModel)
  const [activeTab, setActiveTab] = useState("visual")
  const [dslContent, setDslContent] = useState("")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [performanceIssues, setPerformanceIssues] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleModelChange = useCallback((newModel: OpenFGAModel) => {
    setModel(newModel)
    // Convert model to DSL format
    const dsl = modelToDSL(newModel)
    setDslContent(dsl)
    validateModel(newModel)
  }, [])

  const handleDSLChange = useCallback((newDSL: string) => {
    setDslContent(newDSL)
    try {
      const parsedModel = dslToModel(newDSL)
      setModel(parsedModel)
      validateModel(parsedModel)
    } catch (error) {
      setValidationErrors([`DSL Parse Error: ${error}`])
    }
  }, [])

  const validateModel = (modelToValidate: OpenFGAModel) => {
    const errors: string[] = []
    const issues: any[] = []

    // Basic validation
    if (!modelToValidate.schema_version) {
      errors.push("Schema version is required")
    }

    if (!modelToValidate.type_definitions || modelToValidate.type_definitions.length === 0) {
      errors.push("At least one type definition is required")
    }

    // Performance analysis
    modelToValidate.type_definitions.forEach((typeDef, index) => {
      // Check for deeply nested relations
      Object.entries(typeDef.relations || {}).forEach(([relationName, relation]) => {
        if (hasDeepNesting(relation, 0)) {
          issues.push({
            type: "performance",
            severity: "warning",
            message: `Deep nesting detected in ${typeDef.type}.${relationName}`,
            suggestion: "Consider flattening the relation structure",
          })
        }
      })

      // Check for circular references
      if (hasCircularReference(typeDef, modelToValidate.type_definitions)) {
        issues.push({
          type: "performance",
          severity: "error",
          message: `Potential circular reference in ${typeDef.type}`,
          suggestion: "Review relation dependencies",
        })
      }
    })

    setValidationErrors(errors)
    setPerformanceIssues(issues)
  }

  const hasDeepNesting = (relation: any, depth: number): boolean => {
    if (depth > 3) return true

    if (relation.union?.child) {
      return relation.union.child.some((child: any) => hasDeepNesting(child, depth + 1))
    }

    if (relation.intersection?.child) {
      return relation.intersection.child.some((child: any) => hasDeepNesting(child, depth + 1))
    }

    return false
  }

  const hasCircularReference = (typeDef: TypeDefinition, allTypes: TypeDefinition[]): boolean => {
    // Simplified circular reference detection
    const visited = new Set<string>()

    const checkCircular = (currentType: string): boolean => {
      if (visited.has(currentType)) return true
      visited.add(currentType)

      const type = allTypes.find((t) => t.type === currentType)
      if (!type) return false

      // Check relations for references to other types
      for (const relation of Object.values(type.relations || {})) {
        if (relation.computedUserset?.object && checkCircular(relation.computedUserset.object)) {
          return true
        }
      }

      visited.delete(currentType)
      return false
    }

    return checkCircular(typeDef.type)
  }

  const modelToDSL = (model: OpenFGAModel): string => {
    let dsl = `model
  schema 1.1

`

    model.type_definitions.forEach((typeDef) => {
      dsl += `type ${typeDef.type}\n`

      Object.entries(typeDef.relations || {}).forEach(([relationName, relation]) => {
        dsl += `  relations\n`
        dsl += `    define ${relationName}: ${relationToString(relation)}\n`
      })

      dsl += "\n"
    })

    return dsl
  }

  const relationToString = (relation: Relation): string => {
    if (relation.this) return "[user]"
    if (relation.union) return `${relation.union.child?.map(() => "[user]").join(" or ") || "[user]"}`
    if (relation.computedUserset) return `${relation.computedUserset.relation || "[user]"}`
    return "[user]"
  }

  const dslToModel = (dsl: string): OpenFGAModel => {
    // Simplified DSL parser - in a real implementation, use openfga/syntax-transformer
    const lines = dsl.split("\n").filter((line) => line.trim())
    const model: OpenFGAModel = {
      schema_version: "1.1",
      type_definitions: [],
    }

    let currentType: TypeDefinition | null = null

    lines.forEach((line) => {
      const trimmed = line.trim()

      if (trimmed.startsWith("type ")) {
        if (currentType) {
          model.type_definitions.push(currentType)
        }
        currentType = {
          type: trimmed.replace("type ", ""),
          relations: {},
        }
      } else if (trimmed.startsWith("define ") && currentType) {
        const [, relationDef] = trimmed.split("define ")
        const [relationName] = relationDef.split(":")
        currentType.relations[relationName.trim()] = { this: {} }
      }
    })

    if (currentType) {
      model.type_definitions.push(currentType)
    }

    return model
  }

  const exportModel = () => {
    const dataStr = JSON.stringify(model, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = "openfga-model.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const importModel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedModel = JSON.parse(e.target?.result as string)
          handleModelChange(importedModel)
        } catch (error) {
          setValidationErrors([`Import Error: ${error}`])
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">OpenFGA Forge</h1>
          <p className="text-muted-foreground">Interactive authorization modeling for OpenFGA</p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={exportModel} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Model
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import Model
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={importModel} className="hidden" />
          <div className="flex items-center gap-2">
            <Badge variant={validationErrors.length > 0 ? "destructive" : "default"}>
              {validationErrors.length > 0 ? (
                <>
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {validationErrors.length} Error{validationErrors.length !== 1 ? "s" : ""}
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Valid
                </>
              )}
            </Badge>
            {performanceIssues.length > 0 && (
              <Badge variant="secondary">
                <Info className="w-3 h-3 mr-1" />
                {performanceIssues.length} Issue{performanceIssues.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Entity Panel */}
          <div className="lg:col-span-1">
            <EntityPanel model={model} onModelChange={handleModelChange} />
          </div>

          {/* Main Editor */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="visual">
                  <Eye className="w-4 h-4 mr-2" />
                  Visual
                </TabsTrigger>
                <TabsTrigger value="dsl">
                  <Code className="w-4 h-4 mr-2" />
                  DSL
                </TabsTrigger>
                <TabsTrigger value="flow">
                  <GitBranch className="w-4 h-4 mr-2" />
                  Flow
                </TabsTrigger>
                <TabsTrigger value="performance">
                  <Play className="w-4 h-4 mr-2" />
                  Analysis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="mt-6">
                <VisualEditor model={model} onModelChange={handleModelChange} />
              </TabsContent>

              <TabsContent value="dsl" className="mt-6">
                <DSLEditor content={dslContent} onChange={handleDSLChange} model={model} />
              </TabsContent>

              <TabsContent value="flow" className="mt-6">
                <FlowDiagramViewer model={model} />
              </TabsContent>

              <TabsContent value="performance" className="mt-6">
                <PerformanceAnalyzer model={model} issues={performanceIssues} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
