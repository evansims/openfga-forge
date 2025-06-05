"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ArrowRight, Users, FileText, Shield, Edit, X } from "lucide-react"
import { RelationEditor } from "@/components/relation-editor"

interface VisualEditorProps {
  model: any
  onModelChange: (model: any) => void
}

export function VisualEditor({ model, onModelChange }: VisualEditorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [editingRelation, setEditingRelation] = useState<{
    typeName: string
    relationName: string
    relation: any
  } | null>(null)

  const getTypeIcon = (type: string) => {
    if (type.includes("user")) return <Users className="w-4 h-4" />
    if (type.includes("document") || type.includes("file")) return <FileText className="w-4 h-4" />
    return <Shield className="w-4 h-4" />
  }

  const getRelationColor = (relationName: string) => {
    const colors = {
      owner: "bg-red-100 text-red-800 border-red-200",
      editor: "bg-blue-100 text-blue-800 border-blue-200",
      viewer: "bg-green-100 text-green-800 border-green-200",
      admin: "bg-purple-100 text-purple-800 border-purple-200",
      member: "bg-yellow-100 text-yellow-800 border-yellow-200",
    }
    return colors[relationName as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getRelationTypeLabel = (relation: any) => {
    if (relation.this) return "Direct"
    if (relation.union) return "Union"
    if (relation.intersection) return "Intersection"
    if (relation.difference) return "Difference"
    if (relation.computedUserset) return "Computed"
    if (relation.tupleToUserset) return "Tuple to Userset"
    return "Complex"
  }

  const getRelationDescription = (relation: any) => {
    if (relation.this) return "Direct assignment"
    if (relation.union) return `Union of ${relation.union.child?.length || 0} relations`
    if (relation.intersection) return `Intersection of ${relation.intersection.child?.length || 0} relations`
    if (relation.difference) return "Difference operation"
    if (relation.computedUserset) return `Computed from ${relation.computedUserset.relation || "relation"}`
    if (relation.tupleToUserset) return "Tuple to userset mapping"
    return "Complex relation structure"
  }

  const addNewType = () => {
    const newTypeName = `type_${model.type_definitions.length + 1}`
    const updatedModel = {
      ...model,
      type_definitions: [
        ...model.type_definitions,
        {
          type: newTypeName,
          relations: {},
        },
      ],
    }
    onModelChange(updatedModel)
  }

  const removeType = (typeToRemove: string) => {
    const updatedModel = {
      ...model,
      type_definitions: model.type_definitions.filter((t: any) => t.type !== typeToRemove),
    }
    onModelChange(updatedModel)
    if (selectedType === typeToRemove) {
      setSelectedType(null)
    }
  }

  const addRelation = (typeName: string) => {
    const relationName = `relation_${Object.keys(model.type_definitions.find((t: any) => t.type === typeName)?.relations || {}).length + 1}`
    const updatedModel = {
      ...model,
      type_definitions: model.type_definitions.map((t: any) =>
        t.type === typeName
          ? {
              ...t,
              relations: {
                ...t.relations,
                [relationName]: { this: {} },
              },
            }
          : t,
      ),
    }
    onModelChange(updatedModel)
  }

  const removeRelation = (typeName: string, relationName: string) => {
    const updatedModel = {
      ...model,
      type_definitions: model.type_definitions.map((t: any) =>
        t.type === typeName
          ? {
              ...t,
              relations: Object.fromEntries(Object.entries(t.relations).filter(([key]) => key !== relationName)),
            }
          : t,
      ),
    }
    onModelChange(updatedModel)
  }

  const editRelation = (typeName: string, relationName: string, relation: any) => {
    setEditingRelation({ typeName, relationName, relation })
  }

  const saveRelation = (updatedRelation: any) => {
    if (!editingRelation) return

    const updatedModel = {
      ...model,
      type_definitions: model.type_definitions.map((t: any) =>
        t.type === editingRelation.typeName
          ? {
              ...t,
              relations: {
                ...t.relations,
                [editingRelation.relationName]: updatedRelation,
              },
            }
          : t,
      ),
    }
    onModelChange(updatedModel)
    setEditingRelation(null)
  }

  const cancelEdit = () => {
    setEditingRelation(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Authorization Model Visualization</h3>
        <Button onClick={addNewType} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Type
        </Button>
      </div>

      {/* Relation Editor Modal */}
      {editingRelation && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Edit Relation: {editingRelation.typeName}.{editingRelation.relationName}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <RelationEditor
              relation={editingRelation.relation}
              availableTypes={model.type_definitions}
              currentType={editingRelation.typeName}
              onSave={saveRelation}
              onCancel={cancelEdit}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {model.type_definitions.map((typeDef: any, index: number) => (
          <Card
            key={typeDef.type}
            className={`cursor-pointer transition-all ${
              selectedType === typeDef.type ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
            }`}
            onClick={() => setSelectedType(selectedType === typeDef.type ? null : typeDef.type)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTypeIcon(typeDef.type)}
                  <CardTitle className="text-sm font-medium">{typeDef.type}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeType(typeDef.type)
                  }}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Relations</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      addRelation(typeDef.type)
                    }}
                    className="h-5 w-5 p-0"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(typeDef.relations || {}).map(([relationName, relation]) => (
                    <div key={relationName} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-xs ${getRelationColor(relationName)}`}>
                          {relationName}
                        </Badge>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              editRelation(typeDef.type, relationName, relation)
                            }}
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-primary"
                          >
                            <Edit className="w-2 h-2" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeRelation(typeDef.type, relationName)
                            }}
                            className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-2 h-2" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-xs mr-1">
                          {getRelationTypeLabel(relation)}
                        </Badge>
                        {getRelationDescription(relation)}
                      </div>
                    </div>
                  ))}
                  {Object.keys(typeDef.relations || {}).length === 0 && (
                    <span className="text-xs text-muted-foreground italic">No relations</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Relationship Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Relationship Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {model.type_definitions.map((typeDef: any) => (
              <div key={typeDef.type} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {getTypeIcon(typeDef.type)}
                  <span className="font-medium">{typeDef.type}</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(typeDef.relations || {}).map(([relationName, relation]) => (
                    <div key={relationName} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className={getRelationColor(relationName)}>
                        {relationName}
                      </Badge>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <Badge variant="secondary" className="text-xs">
                        {getRelationTypeLabel(relation)}
                      </Badge>
                      <span className="text-muted-foreground">{getRelationDescription(relation)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
