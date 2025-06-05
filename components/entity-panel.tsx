"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Users, FileText, Shield, Settings, ChevronDown, ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface EntityPanelProps {
  model: any
  onModelChange: (model: any) => void
}

export function EntityPanel({ model, onModelChange }: EntityPanelProps) {
  const [newTypeName, setNewTypeName] = useState("")
  const [newRelationName, setNewRelationName] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  const getTypeIcon = (type: string) => {
    if (type.includes("user")) return <Users className="w-4 h-4" />
    if (type.includes("document") || type.includes("file")) return <FileText className="w-4 h-4" />
    return <Shield className="w-4 h-4" />
  }

  const addType = () => {
    if (!newTypeName.trim()) return

    const updatedModel = {
      ...model,
      type_definitions: [
        ...model.type_definitions,
        {
          type: newTypeName.trim(),
          relations: {},
        },
      ],
    }
    onModelChange(updatedModel)
    setNewTypeName("")
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
    if (!newRelationName.trim()) return

    const updatedModel = {
      ...model,
      type_definitions: model.type_definitions.map((t: any) =>
        t.type === typeName
          ? {
              ...t,
              relations: {
                ...t.relations,
                [newRelationName.trim()]: { this: {} },
              },
            }
          : t,
      ),
    }
    onModelChange(updatedModel)
    setNewRelationName("")
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

  const toggleTypeExpansion = (typeName: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(typeName)) {
      newExpanded.delete(typeName)
    } else {
      newExpanded.add(typeName)
    }
    setExpandedTypes(newExpanded)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Model Structure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Type */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Type name (e.g., user, document)"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addType()}
              />
              <Button onClick={addType} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Type List */}
          <div className="space-y-2">
            {model.type_definitions.map((typeDef: any) => (
              <Collapsible
                key={typeDef.type}
                open={expandedTypes.has(typeDef.type)}
                onOpenChange={() => toggleTypeExpansion(typeDef.type)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        {expandedTypes.has(typeDef.type) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        {getTypeIcon(typeDef.type)}
                        <span className="font-medium">{typeDef.type}</span>
                        <Badge variant="secondary" className="text-xs">
                          {Object.keys(typeDef.relations || {}).length} relations
                        </Badge>
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
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-3 border-t">
                      {/* Add Relation */}
                      <div className="flex gap-2 pt-2">
                        <Input
                          placeholder="Relation name"
                          value={selectedType === typeDef.type ? newRelationName : ""}
                          onChange={(e) => {
                            setSelectedType(typeDef.type)
                            setNewRelationName(e.target.value)
                          }}
                          onKeyPress={(e) => e.key === "Enter" && addRelation(typeDef.type)}
                          className="text-sm"
                        />
                        <Button onClick={() => addRelation(typeDef.type)} size="sm" variant="outline">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Relations List */}
                      <div className="space-y-1">
                        {Object.entries(typeDef.relations || {}).map(([relationName, relation]) => (
                          <div
                            key={relationName}
                            className="flex items-center justify-between py-1 px-2 rounded bg-muted/30"
                          >
                            <div className="flex items-center gap-2">
                              <Settings className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{relationName}</span>
                              <Badge variant="outline" className="text-xs">
                                {relation.this
                                  ? "direct"
                                  : relation.union
                                    ? "union"
                                    : relation.computedUserset
                                      ? "computed"
                                      : "complex"}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRelation(typeDef.type, relationName)}
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-2 h-2" />
                            </Button>
                          </div>
                        ))}
                        {Object.keys(typeDef.relations || {}).length === 0 && (
                          <p className="text-xs text-muted-foreground italic py-2">No relations defined</p>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>

          {model.type_definitions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No types defined yet</p>
              <p className="text-xs">Add your first type to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              const userType = {
                type: "user",
                relations: {},
              }
              const updatedModel = {
                ...model,
                type_definitions: [...model.type_definitions, userType],
              }
              onModelChange(updatedModel)
            }}
          >
            <Users className="w-4 h-4 mr-2" />
            Add User Type
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              const docType = {
                type: "document",
                relations: {
                  owner: { this: {} },
                  viewer: { this: {} },
                },
              }
              const updatedModel = {
                ...model,
                type_definitions: [...model.type_definitions, docType],
              }
              onModelChange(updatedModel)
            }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Add Document Type
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
