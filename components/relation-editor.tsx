"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Trash2,
  Save,
  X,
  Info,
  Users,
  Merge,
  CrossIcon as Intersect,
  Minus,
  Calculator,
  Link,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface RelationEditorProps {
  relation: any
  availableTypes: any[]
  currentType: string
  onSave: (relation: any) => void
  onCancel: () => void
}

interface RelationChild {
  id: string
  type: "this" | "computedUserset" | "tupleToUserset"
  this?: {}
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

export function RelationEditor({ relation, availableTypes, currentType, onSave, onCancel }: RelationEditorProps) {
  const [relationType, setRelationType] = useState<
    "this" | "union" | "intersection" | "difference" | "computedUserset" | "tupleToUserset"
  >("this")
  const [children, setChildren] = useState<RelationChild[]>([])
  const [computedUserset, setComputedUserset] = useState({ object: "", relation: "" })
  const [tupleToUserset, setTupleToUserset] = useState({
    tupleset: { object: "", relation: "" },
    computedUserset: { object: "", relation: "" },
  })
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["main"]))

  useEffect(() => {
    // Initialize state from existing relation
    if (relation.this) {
      setRelationType("this")
    } else if (relation.union) {
      setRelationType("union")
      setChildren(parseChildren(relation.union.child || []))
    } else if (relation.intersection) {
      setRelationType("intersection")
      setChildren(parseChildren(relation.intersection.child || []))
    } else if (relation.difference) {
      setRelationType("difference")
      setChildren(parseChildren(relation.difference.child || []))
    } else if (relation.computedUserset) {
      setRelationType("computedUserset")
      setComputedUserset({
        object: relation.computedUserset.object || "",
        relation: relation.computedUserset.relation || "",
      })
    } else if (relation.tupleToUserset) {
      setRelationType("tupleToUserset")
      setTupleToUserset({
        tupleset: {
          object: relation.tupleToUserset.tupleset?.object || "",
          relation: relation.tupleToUserset.tupleset?.relation || "",
        },
        computedUserset: {
          object: relation.tupleToUserset.computedUserset?.object || "",
          relation: relation.tupleToUserset.computedUserset?.relation || "",
        },
      })
    }
  }, [relation])

  const parseChildren = (childArray: any[]): RelationChild[] => {
    return childArray.map((child, index) => ({
      id: `child_${index}`,
      type: child.this ? "this" : child.computedUserset ? "computedUserset" : "tupleToUserset",
      ...child,
    }))
  }

  const addChild = () => {
    const newChild: RelationChild = {
      id: `child_${Date.now()}`,
      type: "this",
      this: {},
    }
    setChildren([...children, newChild])
  }

  const removeChild = (id: string) => {
    setChildren(children.filter((child) => child.id !== id))
  }

  const updateChild = (id: string, updates: Partial<RelationChild>) => {
    setChildren(children.map((child) => (child.id === id ? { ...child, ...updates } : child)))
  }

  const getAvailableRelations = (typeName: string) => {
    const type = availableTypes.find((t) => t.type === typeName)
    return type ? Object.keys(type.relations || {}) : []
  }

  const buildRelation = () => {
    switch (relationType) {
      case "this":
        return { this: {} }

      case "union":
        return {
          union: {
            child: children.map((child) => {
              const { id, type, ...rest } = child
              return rest
            }),
          },
        }

      case "intersection":
        return {
          intersection: {
            child: children.map((child) => {
              const { id, type, ...rest } = child
              return rest
            }),
          },
        }

      case "difference":
        return {
          difference: {
            child: children.map((child) => {
              const { id, type, ...rest } = child
              return rest
            }),
          },
        }

      case "computedUserset":
        return {
          computedUserset: {
            object: computedUserset.object || "",
            relation: computedUserset.relation,
          },
        }

      case "tupleToUserset":
        return {
          tupleToUserset: {
            tupleset: {
              object: tupleToUserset.tupleset.object || "",
              relation: tupleToUserset.tupleset.relation,
            },
            computedUserset: {
              object: tupleToUserset.computedUserset.object || "",
              relation: tupleToUserset.computedUserset.relation,
            },
          },
        }

      default:
        return { this: {} }
    }
  }

  const handleSave = () => {
    const builtRelation = buildRelation()
    onSave(builtRelation)
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const getRelationTypeIcon = (type: string) => {
    switch (type) {
      case "this":
        return <Users className="w-4 h-4" />
      case "union":
        return <Merge className="w-4 h-4" />
      case "intersection":
        return <Intersect className="w-4 h-4" />
      case "difference":
        return <Minus className="w-4 h-4" />
      case "computedUserset":
        return <Calculator className="w-4 h-4" />
      case "tupleToUserset":
        return <Link className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Relation Type Selection */}
      <Collapsible open={expandedSections.has("main")} onOpenChange={() => toggleSection("main")}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
            {expandedSections.has("main") ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <h4 className="font-medium">Relation Type</h4>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 p-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { value: "this", label: "Direct Assignment", icon: Users, description: "Direct user assignment" },
                { value: "union", label: "Union", icon: Merge, description: "Any of the child relations" },
                {
                  value: "intersection",
                  label: "Intersection",
                  icon: Intersect,
                  description: "All of the child relations",
                },
                { value: "difference", label: "Difference", icon: Minus, description: "First minus second relation" },
                {
                  value: "computedUserset",
                  label: "Computed",
                  icon: Calculator,
                  description: "Computed from another relation",
                },
                {
                  value: "tupleToUserset",
                  label: "Tuple to Userset",
                  icon: Link,
                  description: "Complex tuple mapping",
                },
              ].map(({ value, label, icon: Icon, description }) => (
                <Button
                  key={value}
                  variant={relationType === value ? "default" : "outline"}
                  className="h-auto p-3 flex flex-col items-center gap-2"
                  onClick={() => setRelationType(value as any)}
                >
                  <Icon className="w-4 h-4" />
                  <div className="text-center">
                    <div className="text-xs font-medium">{label}</div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                </Button>
              ))}
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>
                  {relationType === "this"
                    ? "Direct Assignment"
                    : relationType === "union"
                      ? "Union Operation"
                      : relationType === "intersection"
                        ? "Intersection Operation"
                        : relationType === "difference"
                          ? "Difference Operation"
                          : relationType === "computedUserset"
                            ? "Computed Userset"
                            : "Tuple to Userset"}
                  :
                </strong>{" "}
                {relationType === "this" && "Users are directly assigned this relation."}
                {relationType === "union" && "Users have this relation if they have ANY of the child relations."}
                {relationType === "intersection" && "Users have this relation if they have ALL of the child relations."}
                {relationType === "difference" &&
                  "Users have this relation if they have the first relation but NOT the second."}
                {relationType === "computedUserset" &&
                  "This relation is computed from another relation on the same or different object."}
                {relationType === "tupleToUserset" && "Complex mapping from tuple relationships to usersets."}
              </AlertDescription>
            </Alert>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Configuration based on relation type */}
      {(relationType === "union" || relationType === "intersection" || relationType === "difference") && (
        <Collapsible open={expandedSections.has("children")} onOpenChange={() => toggleSection("children")}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
              {expandedSections.has("children") ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <h4 className="font-medium">Child Relations ({children.length})</h4>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-4 p-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Configure the child relations for this {relationType} operation
                </span>
                <Button onClick={addChild} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Child
                </Button>
              </div>

              <div className="space-y-3">
                {children.map((child, index) => (
                  <Card key={child.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">Child {index + 1}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChild(child.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={child.type === "this" ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            updateChild(child.id, {
                              type: "this",
                              this: {},
                              computedUserset: undefined,
                              tupleToUserset: undefined,
                            })
                          }
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Direct
                        </Button>
                        <Button
                          variant={child.type === "computedUserset" ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            updateChild(child.id, {
                              type: "computedUserset",
                              this: undefined,
                              computedUserset: { object: "", relation: "" },
                              tupleToUserset: undefined,
                            })
                          }
                        >
                          <Calculator className="w-3 h-3 mr-1" />
                          Computed
                        </Button>
                        <Button
                          variant={child.type === "tupleToUserset" ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            updateChild(child.id, {
                              type: "tupleToUserset",
                              this: undefined,
                              computedUserset: undefined,
                              tupleToUserset: {
                                tupleset: { object: "", relation: "" },
                                computedUserset: { object: "", relation: "" },
                              },
                            })
                          }
                        >
                          <Link className="w-3 h-3 mr-1" />
                          Tuple
                        </Button>
                      </div>

                      {child.type === "computedUserset" && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Object Type</Label>
                            <Select
                              value={child.computedUserset?.object || "default"}
                              onValueChange={(value) =>
                                updateChild(child.id, {
                                  computedUserset: { ...child.computedUserset, object: value },
                                })
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Same object</SelectItem>
                                {availableTypes.map((type) => (
                                  <SelectItem key={type.type} value={type.type}>
                                    {type.type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Relation</Label>
                            <Select
                              value={child.computedUserset?.relation || "default"}
                              onValueChange={(value) =>
                                updateChild(child.id, {
                                  computedUserset: { ...child.computedUserset, relation: value },
                                })
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select relation" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableRelations(child.computedUserset?.object || currentType).map((relation) => (
                                  <SelectItem key={relation} value={relation}>
                                    {relation}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {child.type === "tupleToUserset" && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium">Tupleset</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Object</Label>
                              <Select
                                value={child.tupleToUserset?.tupleset?.object || "default"}
                                onValueChange={(value) =>
                                  updateChild(child.id, {
                                    tupleToUserset: {
                                      ...child.tupleToUserset,
                                      tupleset: { ...child.tupleToUserset?.tupleset, object: value },
                                    },
                                  })
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">Same object</SelectItem>
                                  {availableTypes.map((type) => (
                                    <SelectItem key={type.type} value={type.type}>
                                      {type.type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Relation</Label>
                              <Select
                                value={child.tupleToUserset?.tupleset?.relation || "default"}
                                onValueChange={(value) =>
                                  updateChild(child.id, {
                                    tupleToUserset: {
                                      ...child.tupleToUserset,
                                      tupleset: { ...child.tupleToUserset?.tupleset, relation: value },
                                    },
                                  })
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select relation" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableRelations(child.tupleToUserset?.tupleset?.object || "").map(
                                    (relation) => (
                                      <SelectItem key={relation} value={relation}>
                                        {relation}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="text-xs font-medium">Computed Userset</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Object</Label>
                              <Select
                                value={child.tupleToUserset?.computedUserset?.object || "default"}
                                onValueChange={(value) =>
                                  updateChild(child.id, {
                                    tupleToUserset: {
                                      ...child.tupleToUserset,
                                      computedUserset: { ...child.tupleToUserset?.computedUserset, object: value },
                                    },
                                  })
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="default">Same object</SelectItem>
                                  {availableTypes.map((type) => (
                                    <SelectItem key={type.type} value={type.type}>
                                      {type.type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Relation</Label>
                              <Select
                                value={child.tupleToUserset?.computedUserset?.relation || "default"}
                                onValueChange={(value) =>
                                  updateChild(child.id, {
                                    tupleToUserset: {
                                      ...child.tupleToUserset,
                                      computedUserset: { ...child.tupleToUserset?.computedUserset, relation: value },
                                    },
                                  })
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select relation" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getAvailableRelations(
                                    child.tupleToUserset?.computedUserset?.object || currentType,
                                  ).map((relation) => (
                                    <SelectItem key={relation} value={relation}>
                                      {relation}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {children.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Merge className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No child relations defined</p>
                    <p className="text-xs">Add child relations to build your {relationType} operation</p>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {relationType === "computedUserset" && (
        <Collapsible open={expandedSections.has("computed")} onOpenChange={() => toggleSection("computed")}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
              {expandedSections.has("computed") ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <h4 className="font-medium">Computed Userset Configuration</h4>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-4 p-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Object Type</Label>
                  <Select
                    value={computedUserset.object || "default"}
                    onValueChange={(value) => setComputedUserset({ ...computedUserset, object: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select object type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Same object</SelectItem>
                      {availableTypes.map((type) => (
                        <SelectItem key={type.type} value={type.type}>
                          {type.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Relation</Label>
                  <Select
                    value={computedUserset.relation || "default"}
                    onValueChange={(value) => setComputedUserset({ ...computedUserset, relation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRelations(computedUserset.object || currentType).map((relation) => (
                        <SelectItem key={relation} value={relation}>
                          {relation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {relationType === "tupleToUserset" && (
        <Collapsible open={expandedSections.has("tuple")} onOpenChange={() => toggleSection("tuple")}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
              {expandedSections.has("tuple") ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <h4 className="font-medium">Tuple to Userset Configuration</h4>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-4 p-2">
              <div>
                <h5 className="font-medium mb-2">Tupleset</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Object Type</Label>
                    <Select
                      value={tupleToUserset.tupleset.object || "default"}
                      onValueChange={(value) =>
                        setTupleToUserset({
                          ...tupleToUserset,
                          tupleset: { ...tupleToUserset.tupleset, object: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select object type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Same object</SelectItem>
                        {availableTypes.map((type) => (
                          <SelectItem key={type.type} value={type.type}>
                            {type.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Relation</Label>
                    <Select
                      value={tupleToUserset.tupleset.relation || "default"}
                      onValueChange={(value) =>
                        setTupleToUserset({
                          ...tupleToUserset,
                          tupleset: { ...tupleToUserset.tupleset, relation: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRelations(tupleToUserset.tupleset.object).map((relation) => (
                          <SelectItem key={relation} value={relation}>
                            {relation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Computed Userset</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Object Type</Label>
                    <Select
                      value={tupleToUserset.computedUserset.object || "default"}
                      onValueChange={(value) =>
                        setTupleToUserset({
                          ...tupleToUserset,
                          computedUserset: { ...tupleToUserset.computedUserset, object: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select object type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Same object</SelectItem>
                        {availableTypes.map((type) => (
                          <SelectItem key={type.type} value={type.type}>
                            {type.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Relation</Label>
                    <Select
                      value={tupleToUserset.computedUserset.relation || "default"}
                      onValueChange={(value) =>
                        setTupleToUserset({
                          ...tupleToUserset,
                          computedUserset: { ...tupleToUserset.computedUserset, relation: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableRelations(tupleToUserset.computedUserset.object || currentType).map((relation) => (
                          <SelectItem key={relation} value={relation}>
                            {relation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Preview */}
      <Collapsible open={expandedSections.has("preview")} onOpenChange={() => toggleSection("preview")}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded">
            {expandedSections.has("preview") ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <h4 className="font-medium">Relation Preview</h4>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="p-4">
            <pre className="text-xs bg-muted p-3 rounded overflow-auto">{JSON.stringify(buildRelation(), null, 2)}</pre>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleSave} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save Relation
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
