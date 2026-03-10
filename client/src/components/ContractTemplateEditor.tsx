import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Eye, Save } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface TemplateField {
  id?: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  textAlignment: "left" | "center" | "right";
  fontColor: string;
  isRequired: boolean;
}

interface ContractTemplateEditorProps {
  templateUrl: string;
  templateWidth: number;
  templateHeight: number;
  templateId: number;
  onSave?: () => void;
}

export default function ContractTemplateEditor({
  templateUrl,
  templateWidth,
  templateHeight,
  templateId,
  onSave,
}: ContractTemplateEditorProps) {
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [newField, setNewField] = useState<Partial<TemplateField>>({
    fieldName: "",
    fieldLabel: "",
    fieldType: "text",
    fontSize: 12,
    fontFamily: "Arial",
    textAlignment: "left",
    fontColor: "#000000",
    isRequired: false,
  });

  const saveFieldsMutation = trpc.contractTemplate.saveFields.useMutation({
    onSuccess: () => {
      toast.success("Fields saved successfully");
      onSave?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save fields");
    },
  });

  const addField = () => {
    if (!newField.fieldName || !newField.fieldLabel) {
      toast.error("Please fill in field name and label");
      return;
    }

    const field: TemplateField = {
      id: `field-${Date.now()}`,
      fieldName: newField.fieldName,
      fieldLabel: newField.fieldLabel,
      fieldType: newField.fieldType || "text",
      positionX: 50,
      positionY: 50,
      width: 200,
      height: 30,
      fontSize: newField.fontSize || 12,
      fontFamily: newField.fontFamily || "Arial",
      textAlignment: newField.textAlignment || "left",
      fontColor: newField.fontColor || "#000000",
      isRequired: newField.isRequired || false,
    };

    setFields([...fields, field]);
    setNewField({
      fieldName: "",
      fieldLabel: "",
      fieldType: "text",
      fontSize: 12,
      fontFamily: "Arial",
      textAlignment: "left",
      fontColor: "#000000",
      isRequired: false,
    });
    toast.success("Field added. Drag it on the template to position it.");
  };

  const deleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedField === id) {
      setSelectedField(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, fieldId: string, handle?: string) => {
    e.preventDefault();
    const field = fields.find((f) => f.id === fieldId);
    if (!field || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setDragOffset({
        x: mouseX - (field.positionX + field.width),
        y: mouseY - (field.positionY + field.height),
      });
    } else {
      setIsDragging(true);
      setDragOffset({
        x: mouseX - field.positionX,
        y: mouseY - field.positionY,
      });
    }

    setSelectedField(fieldId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging && selectedField) {
      const field = fields.find((f) => f.id === selectedField);
      if (!field) return;

      const newX = Math.max(0, Math.min(mouseX - dragOffset.x, templateWidth - field.width));
      const newY = Math.max(0, Math.min(mouseY - dragOffset.y, templateHeight - field.height));

      setFields(
        fields.map((f) =>
          f.id === selectedField
            ? { ...f, positionX: newX, positionY: newY }
            : f
        )
      );
    } else if (isResizing && selectedField && resizeHandle) {
      const field = fields.find((f) => f.id === selectedField);
      if (!field) return;

      let newWidth = field.width;
      let newHeight = field.height;

      if (resizeHandle.includes("e")) {
        newWidth = Math.max(50, mouseX - field.positionX - dragOffset.x);
      }
      if (resizeHandle.includes("s")) {
        newHeight = Math.max(30, mouseY - field.positionY - dragOffset.y);
      }

      setFields(
        fields.map((f) =>
          f.id === selectedField
            ? { ...f, width: newWidth, height: newHeight }
            : f
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const saveFields = async () => {
    try {
      await saveFieldsMutation.mutateAsync({
        templateId,
        fields: fields.map((f) => ({
          fieldName: f.fieldName,
          fieldLabel: f.fieldLabel,
          fieldType: f.fieldType,
          positionX: f.positionX,
          positionY: f.positionY,
          width: f.width,
          height: f.height,
          fontSize: f.fontSize,
          fontFamily: f.fontFamily,
          textAlignment: f.textAlignment,
          fontColor: f.fontColor,
          isRequired: f.isRequired,
        })),
      });
    } catch (error) {
      console.error("Failed to save fields:", error);
    }
  };

  const selectedFieldData = fields.find((f) => f.id === selectedField);

  return (
    <div className="space-y-6">
      {/* Field Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Field</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Field Name</Label>
              <Input
                placeholder="e.g., client_name"
                value={newField.fieldName || ""}
                onChange={(e) => setNewField({ ...newField, fieldName: e.target.value })}
              />
            </div>
            <div>
              <Label>Field Label</Label>
              <Input
                placeholder="e.g., Client Name"
                value={newField.fieldLabel || ""}
                onChange={(e) => setNewField({ ...newField, fieldLabel: e.target.value })}
              />
            </div>
            <div>
              <Label>Font Family</Label>
              <Select value={newField.fontFamily} onValueChange={(v) => setNewField({ ...newField, fontFamily: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Font Size</Label>
              <Input
                type="number"
                min="8"
                max="72"
                value={newField.fontSize || 12}
                onChange={(e) => setNewField({ ...newField, fontSize: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>Text Alignment</Label>
              <Select value={newField.textAlignment} onValueChange={(v: any) => setNewField({ ...newField, textAlignment: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Font Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={newField.fontColor || "#000000"}
                  onChange={(e) => setNewField({ ...newField, fontColor: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  type="text"
                  value={newField.fontColor || "#000000"}
                  onChange={(e) => setNewField({ ...newField, fontColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <Button onClick={addField} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Template Editor</CardTitle>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Template Preview</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div
                    className="relative bg-gray-100 border-2 border-gray-300 mx-auto"
                    style={{
                      width: `${templateWidth}px`,
                      height: `${templateHeight}px`,
                      backgroundImage: `url(${templateUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {fields.map((field) => (
                      <div
                        key={field.id}
                        className="absolute border border-blue-300 bg-blue-50 opacity-50"
                        style={{
                          left: `${field.positionX}px`,
                          top: `${field.positionY}px`,
                          width: `${field.width}px`,
                          height: `${field.height}px`,
                          fontSize: `${field.fontSize}px`,
                          fontFamily: field.fontFamily,
                          textAlign: field.textAlignment,
                          color: field.fontColor,
                        }}
                      >
                        <div className="text-xs p-1 overflow-hidden text-ellipsis">
                          {field.fieldLabel}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={saveFields} disabled={saveFieldsMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Fields
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div
            ref={canvasRef}
            className="relative bg-gray-100 border-2 border-gray-300 mx-auto cursor-crosshair"
            style={{
              width: `${templateWidth}px`,
              height: `${templateHeight}px`,
              backgroundImage: `url(${templateUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {fields.map((field) => (
              <div
                key={field.id}
                className={`absolute border-2 cursor-move transition-all ${
                  selectedField === field.id
                    ? "border-blue-500 bg-blue-100 opacity-60"
                    : "border-green-400 bg-green-50 opacity-40 hover:opacity-60"
                }`}
                style={{
                  left: `${field.positionX}px`,
                  top: `${field.positionY}px`,
                  width: `${field.width}px`,
                  height: `${field.height}px`,
                }}
                onMouseDown={(e) => field.id && handleMouseDown(e, field.id)}
              >
                <div
                  className="text-xs p-1 overflow-hidden text-ellipsis font-semibold"
                  style={{
                    fontSize: `${Math.min(field.fontSize, 10)}px`,
                    fontFamily: field.fontFamily,
                    textAlign: field.textAlignment,
                    color: field.fontColor,
                  }}
                >
                  {field.fieldLabel}
                </div>

                {/* Resize Handle */}
                {selectedField === field.id && field.id && (
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                    onMouseDown={(e) => field.id && handleMouseDown(e, field.id, "se")}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Field Properties Panel */}
      {selectedFieldData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Field Properties: {selectedFieldData.fieldLabel}</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => selectedFieldData.id && deleteField(selectedFieldData.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Position X</Label>
                <Input
                  type="number"
                  value={selectedFieldData.positionX}
                  onChange={(e) =>
                    setFields(
                      fields.map((f) =>
                        f.id === selectedField
                          ? { ...f, positionX: parseInt(e.target.value) }
                          : f
                      )
                    )
                  }
                />
              </div>
              <div>
                <Label>Position Y</Label>
                <Input
                  type="number"
                  value={selectedFieldData.positionY}
                  onChange={(e) =>
                    setFields(
                      fields.map((f) =>
                        f.id === selectedField
                          ? { ...f, positionY: parseInt(e.target.value) }
                          : f
                      )
                    )
                  }
                />
              </div>
              <div>
                <Label>Width</Label>
                <Input
                  type="number"
                  value={selectedFieldData.width}
                  onChange={(e) =>
                    setFields(
                      fields.map((f) =>
                        f.id === selectedField
                          ? { ...f, width: parseInt(e.target.value) }
                          : f
                      )
                    )
                  }
                />
              </div>
              <div>
                <Label>Height</Label>
                <Input
                  type="number"
                  value={selectedFieldData.height}
                  onChange={(e) =>
                    setFields(
                      fields.map((f) =>
                        f.id === selectedField
                          ? { ...f, height: parseInt(e.target.value) }
                          : f
                      )
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fields List */}
      {fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fields ({fields.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className={`p-3 border rounded cursor-pointer transition-all ${
                    selectedField === field.id
                      ? "bg-blue-50 border-blue-500"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedField(field.id || null)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{field.fieldLabel}</p>
                      <p className="text-xs text-gray-500">{field.fieldName}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (field.id) deleteField(field.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
