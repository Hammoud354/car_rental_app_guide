import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Trash2, GripVertical, Eye, EyeOff, Grid3X3 } from "lucide-react";

const SAMPLE_DATA: Record<string, string> = {
  clientName: "John Doe",
  clientAddress: "Haret Hreik, Beirut",
  clientPhone: "+961 76 123456",
  clientEmail: "john.doe@example.com",
  clientNationality: "Lebanese",
  clientDateOfBirth: "15/05/1990",
  clientMotherFullName: "Fatima Hassan",
  clientFatherFullName: "Ahmed Doe",
  clientPassportNumber: "P1234567",
  clientPlaceOfBirth: "Beirut",
  clientPlaceOfRegistration: "Beirut",
  clientLicenseNumber: "6789",
  clientLicenseIssueDate: "12/31/2000",
  clientLicenseExpiryDate: "12/31/2036",
  clientRegistrationNumber: "5432",
  vehiclePlate: "654345 M",
  vehicleMake: "Nissan",
  vehicleModel: "Sunny",
  vehicleYear: "2020",
  vehicleType: "Sedan",
  vehicleColor: "Silver",
  vehicleFuelType: "Gasoline",
  vehicleVIN: "1HGBH41JXMN109",
  contractNumber: "CTR-001",
  startDate: "18/02/2026",
  endDate: "25/02/2026",
  pickupTime: "10:00",
  returnTime: "10:00",
  rentalDays: "7",
  dailyRate: "50",
  totalAmount: "350",
  deposit: "100",
  companyName: "Dima Rent A Car",
  companyPhone: "+961 76/354131",
  companyAddress: "Haret Hurik - Main Street",
};

const CONTRACT_FIELDS = [
  { group: "Client", fields: [
    { id: "clientName", label: "Client Name" },
    { id: "clientMotherFullName", label: "Mother's Full Name" },
    { id: "clientFatherFullName", label: "Father's Full Name" },
    { id: "clientNationality", label: "Nationality" },
    { id: "clientPhone", label: "Phone" },
    { id: "clientAddress", label: "Address" },
    { id: "clientEmail", label: "Email" },
    { id: "clientDateOfBirth", label: "Date of Birth" },
    { id: "clientPlaceOfBirth", label: "Place of Birth" },
    { id: "clientPassportNumber", label: "Passport Number" },
    { id: "clientRegistrationNumber", label: "R.No." },
    { id: "clientPlaceOfRegistration", label: "Place of Registration" },
    { id: "clientLicenseNumber", label: "License No." },
    { id: "clientLicenseIssueDate", label: "Issue Date" },
    { id: "clientLicenseExpiryDate", label: "Expiry Date" },
  ]},
  { group: "Vehicle", fields: [
    { id: "vehiclePlate", label: "Plate Number" },
    { id: "vehicleMake", label: "Make / Brand" },
    { id: "vehicleModel", label: "Model" },
    { id: "vehicleYear", label: "Year" },
    { id: "vehicleType", label: "Type" },
    { id: "vehicleColor", label: "Color" },
    { id: "vehicleFuelType", label: "Fuel Type" },
    { id: "vehicleVIN", label: "Chassis / VIN" },
  ]},
  { group: "Contract", fields: [
    { id: "contractNumber", label: "Contract Number" },
    { id: "startDate", label: "Start Date" },
    { id: "endDate", label: "End Date" },
    { id: "pickupTime", label: "Pickup Time" },
    { id: "returnTime", label: "Return Time" },
    { id: "rentalDays", label: "Rental Days" },
    { id: "dailyRate", label: "Daily Rate" },
    { id: "totalAmount", label: "Total Amount" },
    { id: "deposit", label: "Deposit" },
  ]},
  { group: "Company", fields: [
    { id: "companyName", label: "Company Name" },
    { id: "companyPhone", label: "Company Phone" },
    { id: "companyAddress", label: "Company Address" },
  ]},
];

const ALL_FIELDS = CONTRACT_FIELDS.flatMap(g => g.fields);

type FieldPosition = {
  fieldId: string;
  x: number;
  y: number;
  fontSize: number;
  alignment: "left" | "center" | "right";
  fontColor: string;
};

type DragState = {
  fieldId: string;
  startMouseX: number;
  startMouseY: number;
  startFpX: number;
  startFpY: number;
};

export default function ContractTemplateMapper() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: profile, isLoading } = trpc.company.getProfile.useQuery();
  const updateProfile = trpc.company.updateProfile.useMutation();

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [fieldPositions, setFieldPositions] = useState<FieldPosition[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>("Client");

  useEffect(() => {
    if (profile?.contractTemplateFieldMap) {
      const mappings = profile.contractTemplateFieldMap as Record<string, any>;
      const positions: FieldPosition[] = Object.entries(mappings).map(([fieldId, config]) => ({
        fieldId,
        x: config.x ?? 50,
        y: config.y ?? 10,
        fontSize: config.fontSize ?? 11,
        alignment: config.alignment ?? "center",
        fontColor: config.fontColor ?? "#000000",
      }));
      setFieldPositions(positions);
    }
  }, [profile]);

  const getTransform = (alignment: string) => {
    if (alignment === "center") return "translateX(-50%)";
    if (alignment === "right") return "translateX(-100%)";
    return "translateX(0)";
  };

  const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragState.startMouseX) / rect.width) * 100;
    const dy = ((e.clientY - dragState.startMouseY) / rect.height) * 100;
    const newX = Math.max(0, Math.min(100, dragState.startFpX + dx));
    const newY = Math.max(0, Math.min(100, dragState.startFpY + dy));
    setFieldPositions(prev =>
      prev.map(fp =>
        fp.fieldId === dragState.fieldId
          ? { ...fp, x: parseFloat(newX.toFixed(2)), y: parseFloat(newY.toFixed(2)) }
          : fp
      )
    );
  }, [dragState]);

  const handleContainerMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  const handleFieldMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const fp = fieldPositions.find(f => f.fieldId === fieldId);
    if (!fp) return;
    setDragState({
      fieldId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startFpX: fp.x,
      startFpY: fp.y,
    });
    setSelectedFieldId(fieldId);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (dragState) return;
    if (!selectedFieldId || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = parseFloat((((e.clientX - rect.left) / rect.width) * 100).toFixed(2));
    const y = parseFloat((((e.clientY - rect.top) / rect.height) * 100).toFixed(2));

    const existingIndex = fieldPositions.findIndex(fp => fp.fieldId === selectedFieldId);
    if (existingIndex >= 0) {
      setFieldPositions(prev => prev.map(fp =>
        fp.fieldId === selectedFieldId ? { ...fp, x, y } : fp
      ));
    } else {
      setFieldPositions(prev => [...prev, {
        fieldId: selectedFieldId,
        x,
        y,
        fontSize: 11,
        alignment: "center",
        fontColor: "#000000",
      }]);
    }
  };

  const addFieldAtDefault = (fieldId: string) => {
    const already = fieldPositions.find(fp => fp.fieldId === fieldId);
    if (!already) {
      const count = fieldPositions.length;
      setFieldPositions(prev => [...prev, {
        fieldId,
        x: 50,
        y: Math.min(10 + count * 5, 90),
        fontSize: 11,
        alignment: "center",
        fontColor: "#000000",
      }]);
    }
    setSelectedFieldId(fieldId);
  };

  const updateFieldProp = (fieldId: string, prop: keyof FieldPosition, value: any) => {
    setFieldPositions(prev =>
      prev.map(fp => fp.fieldId === fieldId ? { ...fp, [prop]: value } : fp)
    );
  };

  const removeField = (fieldId: string) => {
    setFieldPositions(prev => prev.filter(fp => fp.fieldId !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const handleSave = async () => {
    try {
      const fieldMap: Record<string, any> = {};
      fieldPositions.forEach(fp => {
        fieldMap[fp.fieldId] = {
          x: fp.x,
          y: fp.y,
          fontSize: fp.fontSize,
          alignment: fp.alignment,
          fontColor: fp.fontColor,
        };
      });
      await updateProfile.mutateAsync({
        companyName: profile?.companyName || "",
        contractTemplateFieldMap: fieldMap,
      });
      toast({ title: "Saved", description: "Field positions saved successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile?.contractTemplateUrl) {
    return (
      <div className="container max-w-2xl py-16">
        <Card>
          <CardHeader>
            <CardTitle>No Template Uploaded</CardTitle>
            <CardDescription>Please upload a contract template in Company Settings first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/company-settings")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Company Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedFp = fieldPositions.find(fp => fp.fieldId === selectedFieldId);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/company-settings")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-bold">Contract Template Field Mapper</h1>
            <p className="text-xs text-muted-foreground">
              Click a field to select it, then click on the template or drag to reposition
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowGrid(!showGrid)}>
            <Grid3X3 className="h-4 w-4 mr-1" />
            {showGrid ? "Hide Grid" : "Grid"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showPreview ? "Labels" : "Preview"}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Layout
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: field picker */}
        <div className="w-56 border-r bg-muted/30 flex flex-col overflow-hidden shrink-0">
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fields</p>
            <p className="text-xs text-muted-foreground mt-0.5">{fieldPositions.length} placed</p>
          </div>
          {/* Group tabs */}
          <div className="flex flex-wrap gap-1 px-2 py-2 border-b">
            {CONTRACT_FIELDS.map(g => (
              <button
                key={g.group}
                onClick={() => setActiveGroup(g.group)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  activeGroup === g.group
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-accent"
                }`}
              >
                {g.group}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {CONTRACT_FIELDS.find(g => g.group === activeGroup)?.fields.map(field => {
              const isPlaced = fieldPositions.some(fp => fp.fieldId === field.id);
              const isSelected = selectedFieldId === field.id;
              return (
                <button
                  key={field.id}
                  onClick={() => addFieldAtDefault(field.id)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isPlaced
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200"
                      : "hover:bg-accent"
                  }`}
                >
                  {isPlaced && <span className="text-green-600 dark:text-green-400 shrink-0">✓</span>}
                  {field.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: template image */}
        <div
          className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4"
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          onMouseLeave={handleContainerMouseUp}
          style={{ cursor: dragState ? "grabbing" : selectedFieldId ? "crosshair" : "default" }}
        >
          <div
            ref={containerRef}
            className="relative inline-block shadow-xl"
            style={{ userSelect: "none" }}
          >
            <img
              ref={imageRef}
              src={profile.contractTemplateUrl}
              alt="Contract Template"
              className="block max-w-full h-auto"
              style={{ maxHeight: "calc(100vh - 120px)" }}
              onClick={handleImageClick}
              onLoad={() => setImageLoaded(true)}
              draggable={false}
            />

            {/* Grid overlay */}
            {imageLoaded && showGrid && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 19 }).map((_, i) => (
                  <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-blue-400/20" style={{ left: `${(i + 1) * 5}%` }} />
                ))}
                {Array.from({ length: 19 }).map((_, i) => (
                  <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-blue-400/20" style={{ top: `${(i + 1) * 5}%` }} />
                ))}
              </div>
            )}

            {/* Placed field overlays */}
            {imageLoaded && fieldPositions.map(fp => {
              const field = ALL_FIELDS.find(f => f.id === fp.fieldId);
              const isSelected = fp.fieldId === selectedFieldId;
              const sampleValue = SAMPLE_DATA[fp.fieldId] || fp.fieldId;
              return (
                <div
                  key={fp.fieldId}
                  style={{
                    position: "absolute",
                    left: `${fp.x}%`,
                    top: `${fp.y}%`,
                    transform: getTransform(fp.alignment),
                    zIndex: isSelected ? 20 : 10,
                  }}
                >
                  <div
                    onMouseDown={(e) => handleFieldMouseDown(e, fp.fieldId)}
                    style={{
                      cursor: "grab",
                      whiteSpace: "nowrap",
                      fontSize: `${fp.fontSize}px`,
                      fontFamily: "Arial, sans-serif",
                      color: showPreview ? fp.fontColor : "transparent",
                      backgroundColor: isSelected
                        ? "rgba(59,130,246,0.15)"
                        : showPreview
                        ? "transparent"
                        : "rgba(59,130,246,0.1)",
                      border: isSelected ? "1.5px solid #3b82f6" : showPreview ? "1px dashed rgba(59,130,246,0.4)" : "1px solid rgba(59,130,246,0.4)",
                      borderRadius: "2px",
                      padding: "1px 3px",
                      lineHeight: 1.2,
                    }}
                    title={`${field?.label} — drag to reposition`}
                  >
                    {showPreview ? sampleValue : (
                      <span style={{ color: "#3b82f6", fontSize: "10px", fontFamily: "Arial", fontWeight: "bold" }}>
                        {field?.label}
                      </span>
                    )}
                  </div>
                  {/* Delete dot */}
                  {isSelected && (
                    <button
                      onMouseDown={e => { e.stopPropagation(); removeField(fp.fieldId); }}
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1,
                        zIndex: 30,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right sidebar: field properties */}
        <div className="w-60 border-l bg-background flex flex-col overflow-hidden shrink-0">
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedFp ? `Edit: ${ALL_FIELDS.find(f => f.id === selectedFp.fieldId)?.label}` : "Properties"}
            </p>
          </div>

          {selectedFp ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X (%)</Label>
                  <Input
                    type="number"
                    value={selectedFp.x}
                    onChange={e => updateFieldProp(selectedFp.fieldId, "x", parseFloat(e.target.value) || 0)}
                    min={0} max={100} step={0.5}
                    className="h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Y (%)</Label>
                  <Input
                    type="number"
                    value={selectedFp.y}
                    onChange={e => updateFieldProp(selectedFp.fieldId, "y", parseFloat(e.target.value) || 0)}
                    min={0} max={100} step={0.5}
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Font Size (px)</Label>
                <Input
                  type="number"
                  value={selectedFp.fontSize}
                  onChange={e => updateFieldProp(selectedFp.fieldId, "fontSize", parseInt(e.target.value) || 11)}
                  min={6} max={48}
                  className="h-7 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Alignment</Label>
                <Select
                  value={selectedFp.alignment}
                  onValueChange={v => updateFieldProp(selectedFp.fieldId, "alignment", v)}
                >
                  <SelectTrigger className="h-7 text-xs">
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
                <Label className="text-xs">Text Color</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    value={selectedFp.fontColor}
                    onChange={e => updateFieldProp(selectedFp.fieldId, "fontColor", e.target.value)}
                    className="h-7 w-10 rounded border cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={selectedFp.fontColor}
                    onChange={e => updateFieldProp(selectedFp.fieldId, "fontColor", e.target.value)}
                    className="h-7 text-xs flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>

              <Button
                variant="destructive"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => removeField(selectedFp.fieldId)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove Field
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
              <GripVertical className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">Select a field from the left panel, then click on the template to place it.</p>
              <p className="text-xs mt-2">Drag any placed field to reposition it.</p>
            </div>
          )}

          {/* Placed fields summary */}
          <div className="border-t p-2 space-y-1 max-h-48 overflow-y-auto">
            <p className="text-xs font-medium text-muted-foreground mb-1">Placed fields ({fieldPositions.length})</p>
            {fieldPositions.map(fp => {
              const field = ALL_FIELDS.find(f => f.id === fp.fieldId);
              return (
                <div
                  key={fp.fieldId}
                  onClick={() => setSelectedFieldId(fp.fieldId)}
                  className={`flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                    selectedFieldId === fp.fieldId ? "bg-primary/10 text-primary" : "hover:bg-accent"
                  }`}
                >
                  <span className="truncate">{field?.label}</span>
                  <button
                    onMouseDown={e => { e.stopPropagation(); removeField(fp.fieldId); }}
                    className="text-muted-foreground hover:text-destructive shrink-0 ml-1"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
