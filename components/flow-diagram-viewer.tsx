"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  GitBranch,
  Users,
  Merge,
  CrossIcon as Intersect,
  Calculator,
  Link,
  Play,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
} from "lucide-react"
import { FlowPathAnalyzer } from "@/components/flow-path-analyzer"

interface FlowDiagramViewerProps {
  model: any
}

interface FlowNode {
  id: string
  type: "start" | "relation" | "operation" | "decision" | "end"
  label: string
  description: string
  x: number
  y: number
  width: number
  height: number
  color: string
  icon: any
}

interface FlowEdge {
  id: string
  from: string
  to: string
  label?: string
  color: string
  type: "default" | "success" | "failure"
}

export function FlowDiagramViewer({ model }: FlowDiagramViewerProps) {
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedRelation, setSelectedRelation] = useState<string>("")
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [showAnalyzer, setShowAnalyzer] = useState(false)

  const getAvailableTypes = () => {
    return model.type_definitions.map((t: any) => t.type)
  }

  const getAvailableRelations = (typeName: string) => {
    const type = model.type_definitions.find((t: any) => t.type === typeName)
    return type ? Object.keys(type.relations || {}) : []
  }

  const generateFlowDiagram = (typeName: string, relationName: string) => {
    const type = model.type_definitions.find((t: any) => t.type === typeName)
    if (!type || !type.relations[relationName]) return { nodes: [], edges: [] }

    const relation = type.relations[relationName]
    const nodes: FlowNode[] = []
    const edges: FlowEdge[] = []
    let nodeId = 0
    let currentY = 100

    const createNode = (
      type: FlowNode["type"],
      label: string,
      description: string,
      color: string,
      icon: any,
      x = 200,
      y = currentY,
    ): FlowNode => {
      const node: FlowNode = {
        id: `node_${nodeId++}`,
        type,
        label,
        description,
        x,
        y,
        width: 160,
        height: 80,
        color,
        icon,
      }
      nodes.push(node)
      currentY += 120
      return node
    }

    const createEdge = (from: string, to: string, label?: string, type: FlowEdge["type"] = "default") => {
      const edge: FlowEdge = {
        id: `edge_${from}_${to}`,
        from,
        to,
        label,
        color: type === "success" ? "#22c55e" : type === "failure" ? "#ef4444" : "#6b7280",
        type,
      }
      edges.push(edge)
    }

    // Start node
    const startNode = createNode(
      "start",
      "Authorization Check",
      `Check ${relationName} on ${typeName}`,
      "#3b82f6",
      GitBranch,
    )

    // Generate nodes based on relation type
    if (relation.this) {
      const directNode = createNode("relation", "Direct Assignment", "Check for direct tuple", "#22c55e", Users)
      createEdge(startNode.id, directNode.id, "Direct check")

      const endNode = createNode("end", "Result", "Grant or deny access", "#6b7280", Play)
      createEdge(directNode.id, endNode.id, "Return result")
    } else if (relation.union) {
      const unionNode = createNode("operation", "Union Operation", "Check ANY child relation", "#8b5cf6", Merge)
      createEdge(startNode.id, unionNode.id, "Union evaluation")

      const children = relation.union.child || []
      children.forEach((child: any, index: number) => {
        const childNode = createNode(
          "decision",
          `Child ${index + 1}`,
          getChildDescription(child),
          "#f59e0b",
          getChildIcon(child),
          200 + index * 200,
          currentY,
        )
        createEdge(unionNode.id, childNode.id, `Child ${index + 1}`)
      })

      currentY += 120
      const endNode = createNode("end", "Union Result", "Grant if ANY child succeeds", "#6b7280", Play)
      children.forEach((_: any, index: number) => {
        createEdge(`node_${2 + index}`, endNode.id, "Result")
      })
    } else if (relation.intersection) {
      const intersectionNode = createNode(
        "operation",
        "Intersection Operation",
        "Check ALL child relations",
        "#8b5cf6",
        Intersect,
      )
      createEdge(startNode.id, intersectionNode.id, "Intersection evaluation")

      const children = relation.intersection.child || []
      children.forEach((child: any, index: number) => {
        const childNode = createNode(
          "decision",
          `Child ${index + 1}`,
          getChildDescription(child),
          "#f59e0b",
          getChildIcon(child),
          200 + index * 200,
          currentY,
        )
        createEdge(intersectionNode.id, childNode.id, `Child ${index + 1}`)
      })

      currentY += 120
      const endNode = createNode("end", "Intersection Result", "Grant if ALL children succeed", "#6b7280", Play)
      children.forEach((_: any, index: number) => {
        createEdge(`node_${2 + index}`, endNode.id, "Result")
      })
    } else if (relation.computedUserset) {
      const computedNode = createNode(
        "operation",
        "Computed Userset",
        `Lookup ${relation.computedUserset.relation}`,
        "#8b5cf6",
        Calculator,
      )
      createEdge(startNode.id, computedNode.id, "Computed lookup")

      const endNode = createNode("end", "Computed Result", "Return computed result", "#6b7280", Play)
      createEdge(computedNode.id, endNode.id, "Return result")
    } else if (relation.tupleToUserset) {
      const tupleNode = createNode("operation", "Tuple to Userset", "Complex tuple mapping", "#8b5cf6", Link)
      createEdge(startNode.id, tupleNode.id, "Tuple mapping")

      const endNode = createNode("end", "Tuple Result", "Return mapped result", "#6b7280", Play)
      createEdge(tupleNode.id, endNode.id, "Return result")
    }

    return { nodes, edges }
  }

  const getChildDescription = (child: any): string => {
    if (child.this) return "Direct assignment"
    if (child.computedUserset) return `Computed: ${child.computedUserset.relation}`
    if (child.tupleToUserset) return "Tuple mapping"
    return "Complex relation"
  }

  const getChildIcon = (child: any) => {
    if (child.this) return Users
    if (child.computedUserset) return Calculator
    if (child.tupleToUserset) return Link
    return GitBranch
  }

  const { nodes, edges } =
    selectedType && selectedRelation ? generateFlowDiagram(selectedType, selectedRelation) : { nodes: [], edges: [] }

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.5))
  const handleResetView = () => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }

  const exportDiagram = () => {
    // Create a simple text representation for export
    const diagramText =
      `Flow Diagram: ${selectedType}.${selectedRelation}\n\n` +
      nodes.map((node) => `${node.label}: ${node.description}`).join("\n") +
      "\n\nConnections:\n" +
      edges
        .map(
          (edge) => `${nodes.find((n) => n.id === edge.from)?.label} → ${nodes.find((n) => n.id === edge.to)?.label}`,
        )
        .join("\n")

    const blob = new Blob([diagramText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `flow-diagram-${selectedType}-${selectedRelation}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Flow Diagram Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableTypes().map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Relation</label>
                <Select value={selectedRelation} onValueChange={setSelectedRelation} disabled={!selectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a relation" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRelations(selectedType).map((relation) => (
                      <SelectItem key={relation} value={relation}>
                        {relation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedType && selectedRelation && (
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowAnalyzer(!showAnalyzer)} variant="outline">
                  <Play className="w-4 h-4 mr-2" />
                  {showAnalyzer ? "Hide" : "Show"} Path Analyzer
                </Button>
                <Button onClick={exportDiagram} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flow Diagram */}
      {selectedType && selectedRelation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Flow Diagram: {selectedType}.{selectedRelation}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button onClick={handleZoomOut} variant="outline" size="sm">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Badge variant="outline">{Math.round(zoomLevel * 100)}%</Badge>
                <Button onClick={handleZoomIn} variant="outline" size="sm">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button onClick={handleResetView} variant="outline" size="sm">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg bg-gray-50 min-h-[400px] overflow-auto">
              <svg
                width="100%"
                height="500"
                viewBox={`${-panOffset.x} ${-panOffset.y} ${800 / zoomLevel} ${500 / zoomLevel}`}
                className="cursor-move"
              >
                {/* Render edges */}
                {edges.map((edge) => {
                  const fromNode = nodes.find((n) => n.id === edge.from)
                  const toNode = nodes.find((n) => n.id === edge.to)
                  if (!fromNode || !toNode) return null

                  const x1 = fromNode.x + fromNode.width / 2
                  const y1 = fromNode.y + fromNode.height
                  const x2 = toNode.x + toNode.width / 2
                  const y2 = toNode.y

                  return (
                    <g key={edge.id}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={edge.color}
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                      {edge.label && (
                        <text
                          x={(x1 + x2) / 2}
                          y={(y1 + y2) / 2 - 5}
                          textAnchor="middle"
                          className="text-xs fill-gray-600"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* Render nodes */}
                {nodes.map((node) => {
                  const IconComponent = node.icon
                  return (
                    <g key={node.id}>
                      <rect
                        x={node.x}
                        y={node.y}
                        width={node.width}
                        height={node.height}
                        fill="white"
                        stroke={node.color}
                        strokeWidth="2"
                        rx="8"
                        className="drop-shadow-sm"
                      />
                      <foreignObject x={node.x + 8} y={node.y + 8} width={node.width - 16} height={node.height - 16}>
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <IconComponent className="w-5 h-5 mb-2" style={{ color: node.color }} />
                          <div className="font-medium text-sm">{node.label}</div>
                          <div className="text-xs text-gray-600 mt-1">{node.description}</div>
                        </div>
                      </foreignObject>
                    </g>
                  )
                })}

                {/* Arrow marker definition */}
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                  </marker>
                </defs>
              </svg>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-blue-500 bg-white"></div>
              <span className="text-sm">Start/Entry</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-green-500 bg-white"></div>
              <span className="text-sm">Direct Check</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-purple-500 bg-white"></div>
              <span className="text-sm">Operation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-yellow-500 bg-white"></div>
              <span className="text-sm">Decision</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-2 border-gray-500 bg-white"></div>
              <span className="text-sm">End/Result</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Path Analyzer */}
      {showAnalyzer && selectedType && selectedRelation && (
        <FlowPathAnalyzer model={model} selectedType={selectedType} selectedRelation={selectedRelation} />
      )}

      {/* Help */}
      {!selectedType && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Select a type and relation above to visualize the authorization flow diagram. The diagram will show how
            OpenFGA evaluates permissions for the selected relation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
