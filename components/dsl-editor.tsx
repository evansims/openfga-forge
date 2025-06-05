"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Download, FileJson, FileText } from "lucide-react"
import { useEffect, useState } from "react"

interface DSLEditorProps {
  content: string
  onChange: (content: string) => void
  model: any
}

export function DSLEditor({ content, onChange, model }: DSLEditorProps) {
  const [viewMode, setViewMode] = useState<"dsl" | "json">("dsl")

  const copyToClipboard = () => {
    const contentToCopy = viewMode === "dsl" ? content : JSON.stringify(model, null, 2)
    navigator.clipboard.writeText(contentToCopy)
  }

  const downloadDSL = () => {
    const dataStr = content
    const dataUri = "data:text/plain;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = "openfga-model.fga"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const downloadJSON = () => {
    const dataStr = JSON.stringify(model, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = "openfga-model.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  useEffect(() => {
    if (!content.trim()) {
      const initialDSL = `model
  schema 1.1

type user

type document
  relations
    define owner: [user]
    define editor: [user] or owner
    define viewer: [user] or editor`

      onChange(initialDSL)
    }
  }, [content, onChange])

  const getDisplayContent = () => {
    if (viewMode === "dsl") {
      return content
    } else {
      return JSON.stringify(model, null, 2)
    }
  }

  const handleContentChange = (newContent: string) => {
    if (viewMode === "dsl") {
      onChange(newContent)
    }
    // JSON view is read-only
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>OpenFGA Model Editor</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={viewMode === "dsl" ? downloadDSL : downloadJSON}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "dsl" ? "default" : "outline"}
              onClick={() => setViewMode("dsl")}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2" />
              DSL
            </Button>
            <Button
              variant={viewMode === "json" ? "default" : "outline"}
              onClick={() => setViewMode("json")}
              className="flex-1"
            >
              <FileJson className="w-4 h-4 mr-2" />
              JSON
            </Button>
          </div>

          <Textarea
            value={getDisplayContent()}
            onChange={(e) => handleContentChange(e.target.value)}
            className="min-h-[400px] font-mono text-sm"
            placeholder={viewMode === "dsl" ? "Enter your OpenFGA DSL here..." : "JSON representation of your model"}
            readOnly={viewMode === "json"}
          />

          {viewMode === "dsl" && (
            <div className="text-xs text-muted-foreground">
              <p className="mb-2">DSL Syntax Reference:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <code>model</code> - Start of model definition
                </li>
                <li>
                  <code>schema 1.1</code> - Schema version
                </li>
                <li>
                  <code>type typename</code> - Define a new type
                </li>
                <li>
                  <code>relations</code> - Start relations block
                </li>
                <li>
                  <code>define relation: [user]</code> - Define a relation with user type
                </li>
                <li>
                  <code>union</code>, <code>intersection</code>, <code>difference</code> - Set operations
                </li>
              </ul>
            </div>
          )}

          {viewMode === "json" && (
            <div className="text-xs text-muted-foreground">
              <p className="mb-2">JSON Model Structure:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <code>schema_version</code> - OpenFGA schema version
                </li>
                <li>
                  <code>type_definitions</code> - Array of type definitions
                </li>
                <li>
                  <code>type</code> - Type name (e.g., "user", "document")
                </li>
                <li>
                  <code>relations</code> - Object containing relation definitions
                </li>
                <li>
                  <code>this</code>, <code>union</code>, <code>intersection</code> - Relation operators
                </li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
