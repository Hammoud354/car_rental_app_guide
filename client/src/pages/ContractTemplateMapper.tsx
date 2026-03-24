import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Trash2, GripVertical, Eye, EyeOff, Magnet, AlignCenter, Ruler } from "lucide-react";

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
    { id: "clientPassportNumber", label: "Passport No." },
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

type Guide = { axis: "x" | "y"; value: number };

const SNAP_SIZES = [
  { label: "Off", value: 0 },
  { label: "0.5%", value: 0.5 },
  { label: "1%", value: 1 },
  { label: "2%", value: 2 },
];
const ALIGN_SNAP_THRESHOLD = 0.8; // % tolerance for alignment guide snapping

function snapVal(v: number, snapSize: number) {
  if (!snapSize) return v;
  return Math.round(v / snapSize) * snapSize;
}

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
  const [showGrid, setShowGrid] = useState(true);
  const [snapSize, setSnapSize] = useState(1);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [activeGroup, setActiveGroup] = useState<string>("Client");
  const [guides, setGuides] = useState<Guide[]>([]);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (profile?.contractTemplateFieldMap) {
      const mappings = profile.contractTemplateFieldMap as Record<string, any>;
      const positions: FieldPosition[] = Object.entries(mappings).map(([fieldId, config]) => ({
        fieldId,
        x: config.x ?? 50,
        y: config.y ?? 10,
        fontSize: config.fontSize ?? 11,
        alignment: config.alignment ?? "left",
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

  const computeGuides = useCallback((draggingId: string, newX: number, newY: number): Guide[] => {
    const others = fieldPositions.filter(fp => fp.fieldId !== draggingId);
    const found: Guide[] = [];
    for (const fp of others) {
      if (Math.abs(fp.x - newX) < ALIGN_SNAP_THRESHOLD) found.push({ axis: "x", value: fp.x });
      if (Math.abs(fp.y - newY) < ALIGN_SNAP_THRESHOLD) found.push({ axis: "y", value: fp.y });
    }
    return found;
  }, [fieldPositions]);

  const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorPos({ x: parseFloat(rawX.toFixed(1)), y: parseFloat(rawY.toFixed(1)) });

    if (!dragState) return;
    const dx = ((e.clientX - dragState.startMouseX) / rect.width) * 100;
    const dy = ((e.clientY - dragState.startMouseY) / rect.height) * 100;
    let newX = Math.max(0, Math.min(100, dragState.startFpX + dx));
    let newY = Math.max(0, Math.min(100, dragState.startFpY + dy));

    // Snap to other field alignment guides first
    const others = fieldPositions.filter(fp => fp.fieldId !== dragState.fieldId);
    for (const fp of others) {
      if (Math.abs(fp.x - newX) < ALIGN_SNAP_THRESHOLD) newX = fp.x;
      if (Math.abs(fp.y - newY) < ALIGN_SNAP_THRESHOLD) newY = fp.y;
    }

    // Then snap to grid
    newX = snapVal(newX, snapSize);
    newY = snapVal(newY, snapSize);

    newX = parseFloat(newX.toFixed(2));
    newY = parseFloat(newY.toFixed(2));

    setGuides(computeGuides(dragState.fieldId, newX, newY));

    setFieldPositions(prev =>
      prev.map(fp => fp.fieldId === dragState.fieldId ? { ...fp, x: newX, y: newY } : fp)
    );
  }, [dragState, snapSize, computeGuides, fieldPositions]);

  const handleContainerMouseUp = useCallback(() => {
    setDragState(null);
    setGuides([]);
  }, []);

  const handleFieldMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const fp = fieldPositions.find(f => f.fieldId === fieldId);
    if (!fp) return;
    setDragState({ fieldId, startMouseX: e.clientX, startMouseY: e.clientY, startFpX: fp.x, startFpY: fp.y });
    setSelectedFieldId(fieldId);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (dragState) return;
    if (!selectedFieldId || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    x = parseFloat(snapVal(x, snapSize).toFixed(2));
    y = parseFloat(snapVal(y, snapSize).toFixed(2));

    const existingIndex = fieldPositions.findIndex(fp => fp.fieldId === selectedFieldId);
    if (existingIndex >= 0) {
      setFieldPositions(prev => prev.map(fp =>
        fp.fieldId === selectedFieldId ? { ...fp, x, y } : fp
      ));
    } else {
      setFieldPositions(prev => [...prev, { fieldId: selectedFieldId, x, y, fontSize: 11, alignment: "left", fontColor: "#000000" }]);
    }
  };

  const addFieldAtDefault = (fieldId: string) => {
    const already = fieldPositions.find(fp => fp.fieldId === fieldId);
    if (!already) {
      const count = fieldPositions.length;
      setFieldPositions(prev => [...prev, {
        fieldId, x: 25, y: Math.min(8 + count * 4, 88), fontSize: 11, alignment: "left", fontColor: "#000000",
      }]);
    }
    setSelectedFieldId(fieldId);
  };

  const updateFieldProp = (fieldId: string, prop: keyof FieldPosition, value: any) => {
    setFieldPositions(prev => prev.map(fp => fp.fieldId === fieldId ? { ...fp, [prop]: value } : fp));
  };

  const removeField = (fieldId: string) => {
    setFieldPositions(prev => prev.filter(fp => fp.fieldId !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const handleSave = async () => {
    try {
      const fieldMap: Record<string, any> = {};
      fieldPositions.forEach(fp => {
        fieldMap[fp.fieldId] = { x: fp.x, y: fp.y, fontSize: fp.fontSize, alignment: fp.alignment, fontColor: fp.fontColor };
      });
      await updateProfile.mutateAsync({ companyName: profile?.companyName || "", contractTemplateFieldMap: fieldMap });
      toast({ title: "Saved", description: "Field positions saved successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to save. Please try again.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
              <ArrowLeft className="mr-2 h-4 w-4" /> Go to Company Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedFp = fieldPositions.find(fp => fp.fieldId === selectedFieldId);

  // Compute major grid lines (every 10%) and minor (every 2%)
  const majorLines = Array.from({ length: 9 }, (_, i) => (i + 1) * 10);
  const minorLines = Array.from({ length: 49 }, (_, i) => (i + 1) * 2).filter(v => v % 10 !== 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/company-settings")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-base font-bold leading-none">Template Field Mapper</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedFieldId
                ? `Click on template to place "${ALL_FIELDS.find(f => f.id === selectedFieldId)?.label}" · Drag to move`
                : "Select a field from the left, then click the template to place it"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Snap control */}
          <div className="flex items-center gap-1.5">
            <Magnet className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Snap:</span>
            <Select value={snapSize.toString()} onValueChange={v => setSnapSize(parseFloat(v))}>
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SNAP_SIZES.map(s => (
                  <SelectItem key={s.value} value={s.value.toString()}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant={showGrid ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setShowGrid(!showGrid)}>
            <Ruler className="h-3.5 w-3.5 mr-1" /> Grid
          </Button>
          <Button variant={showPreview ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? <Eye className="h-3.5 w-3.5 mr-1" /> : <EyeOff className="h-3.5 w-3.5 mr-1" />}
            Preview
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            <Save className="mr-1 h-3.5 w-3.5" /> Save Layout
          </Button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar — field list */}
        <div className="w-52 border-r bg-background flex flex-col overflow-hidden shrink-0">
          <div className="px-3 py-2 border-b bg-muted/40">
            <div className="flex gap-1 flex-wrap">
              {CONTRACT_FIELDS.map(g => (
                <button
                  key={g.group}
                  onClick={() => setActiveGroup(g.group)}
                  className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                    activeGroup === g.group ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"
                  }`}
                >
                  {g.group}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {CONTRACT_FIELDS.find(g => g.group === activeGroup)?.fields.map(field => {
              const isPlaced = fieldPositions.some(fp => fp.fieldId === field.id);
              const isSelected = selectedFieldId === field.id;
              return (
                <button
                  key={field.id}
                  onClick={() => addFieldAtDefault(field.id)}
                  className={`w-full text-left text-xs px-3 py-1.5 flex items-center gap-1.5 transition-colors border-b border-border/40 ${
                    isSelected ? "bg-primary text-primary-foreground"
                    : isPlaced ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : "hover:bg-accent"
                  }`}
                >
                  {isPlaced
                    ? <span className="text-green-500 shrink-0 font-bold">✓</span>
                    : <span className="w-3 shrink-0" />}
                  {field.label}
                </button>
              );
            })}
          </div>
          <div className="p-2 border-t text-xs text-muted-foreground">
            {fieldPositions.length} field{fieldPositions.length !== 1 ? "s" : ""} placed
          </div>
        </div>

        {/* Center — canvas */}
        <div
          className="flex-1 overflow-auto"
          style={{ background: "#e8eaed" }}
          onMouseMove={handleContainerMouseMove}
          onMouseUp={handleContainerMouseUp}
          onMouseLeave={handleContainerMouseUp}
        >
          <div className="p-6 min-h-full flex items-start justify-center">
            {/* Ruler + canvas wrapper */}
            <div style={{ position: "relative" }}>
              {/* Top ruler */}
              {showGrid && imageLoaded && imageRef.current && (
                <div
                  style={{
                    position: "absolute",
                    top: -20,
                    left: 0,
                    width: imageRef.current.getBoundingClientRect().width,
                    height: 20,
                    display: "flex",
                    alignItems: "flex-end",
                    overflow: "hidden",
                  }}
                >
                  {majorLines.map(pct => (
                    <div
                      key={pct}
                      style={{
                        position: "absolute",
                        left: `${pct}%`,
                        bottom: 0,
                        transform: "translateX(-50%)",
                        fontSize: "9px",
                        color: "#6b7280",
                        lineHeight: 1,
                        userSelect: "none",
                      }}
                    >
                      {pct}
                    </div>
                  ))}
                </div>
              )}

              {/* Left ruler */}
              {showGrid && imageLoaded && imageRef.current && (
                <div
                  style={{
                    position: "absolute",
                    left: -22,
                    top: 0,
                    width: 22,
                    height: imageRef.current.getBoundingClientRect().height,
                    overflow: "hidden",
                  }}
                >
                  {majorLines.map(pct => (
                    <div
                      key={pct}
                      style={{
                        position: "absolute",
                        top: `${pct}%`,
                        right: 2,
                        transform: "translateY(-50%)",
                        fontSize: "9px",
                        color: "#6b7280",
                        lineHeight: 1,
                        userSelect: "none",
                      }}
                    >
                      {pct}
                    </div>
                  ))}
                </div>
              )}

              {/* Main image + overlays */}
              <div
                ref={containerRef}
                style={{
                  position: "relative",
                  display: "inline-block",
                  boxShadow: "0 4px 32px rgba(0,0,0,0.25)",
                  cursor: dragState ? "grabbing" : selectedFieldId ? "crosshair" : "default",
                  userSelect: "none",
                }}
              >
                <img
                  ref={imageRef}
                  src={profile.contractTemplateUrl}
                  alt="Contract Template"
                  style={{ display: "block", maxHeight: "calc(100vh - 140px)", maxWidth: "100%", height: "auto" }}
                  onClick={handleImageClick}
                  onLoad={() => setImageLoaded(true)}
                  draggable={false}
                />

                {/* Grid overlay */}
                {showGrid && imageLoaded && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                    {/* Minor gridlines — every 2% */}
                    {minorLines.map(pct => (
                      <div key={`mv-${pct}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${pct}%`, borderLeft: "1px solid rgba(99,102,241,0.12)" }} />
                    ))}
                    {minorLines.map(pct => (
                      <div key={`mh-${pct}`} style={{ position: "absolute", left: 0, right: 0, top: `${pct}%`, borderTop: "1px solid rgba(99,102,241,0.12)" }} />
                    ))}
                    {/* Major gridlines — every 10% */}
                    {majorLines.map(pct => (
                      <div key={`Mv-${pct}`} style={{ position: "absolute", top: 0, bottom: 0, left: `${pct}%`, borderLeft: "1px solid rgba(99,102,241,0.3)" }} />
                    ))}
                    {majorLines.map(pct => (
                      <div key={`Mh-${pct}`} style={{ position: "absolute", left: 0, right: 0, top: `${pct}%`, borderTop: "1px solid rgba(99,102,241,0.3)" }} />
                    ))}
                    {/* Center column guide (50%) — stronger */}
                    <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", borderLeft: "1.5px dashed rgba(239,68,68,0.35)" }} />
                  </div>
                )}

                {/* Alignment guides (flash during drag) */}
                {guides.map((g, i) => (
                  g.axis === "x"
                    ? <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${g.value}%`, borderLeft: "1.5px solid #f59e0b", zIndex: 15, pointerEvents: "none" }} />
                    : <div key={i} style={{ position: "absolute", left: 0, right: 0, top: `${g.value}%`, borderTop: "1.5px solid #f59e0b", zIndex: 15, pointerEvents: "none" }} />
                ))}

                {/* Live cursor position */}
                {cursorPos && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 4,
                      right: 4,
                      background: "rgba(0,0,0,0.6)",
                      color: "white",
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: 4,
                      pointerEvents: "none",
                      zIndex: 20,
                      fontFamily: "monospace",
                    }}
                  >
                    x:{cursorPos.x}% y:{cursorPos.y}%
                  </div>
                )}

                {/* Placed fields */}
                {imageLoaded && fieldPositions.map(fp => {
                  const field = ALL_FIELDS.find(f => f.id === fp.fieldId);
                  const isSelected = fp.fieldId === selectedFieldId;
                  const isDraggingThis = dragState?.fieldId === fp.fieldId;
                  return (
                    <div
                      key={fp.fieldId}
                      style={{
                        position: "absolute",
                        left: `${fp.x}%`,
                        top: `${fp.y}%`,
                        transform: getTransform(fp.alignment),
                        zIndex: isSelected ? 20 : 10,
                        pointerEvents: "auto",
                      }}
                    >
                      <div
                        onMouseDown={(e) => handleFieldMouseDown(e, fp.fieldId)}
                        title={`${field?.label} — drag to move`}
                        style={{
                          cursor: isDraggingThis ? "grabbing" : "grab",
                          whiteSpace: "nowrap",
                          fontSize: `${fp.fontSize}px`,
                          fontFamily: "Arial, Helvetica, sans-serif",
                          color: showPreview ? fp.fontColor : "#3b82f6",
                          lineHeight: 1.1,
                          padding: "1px 4px",
                          borderRadius: 2,
                          border: isSelected
                            ? "1.5px solid #3b82f6"
                            : "1px dashed rgba(99,102,241,0.5)",
                          background: isSelected
                            ? "rgba(59,130,246,0.08)"
                            : isDraggingThis
                            ? "rgba(245,158,11,0.15)"
                            : "transparent",
                          boxShadow: isSelected ? "0 0 0 2px rgba(59,130,246,0.2)" : "none",
                        }}
                      >
                        {showPreview
                          ? (SAMPLE_DATA[fp.fieldId] || fp.fieldId)
                          : <span style={{ fontWeight: "bold", fontSize: "10px" }}>{field?.label}</span>
                        }
                      </div>

                      {/* Selected: show remove button + position tooltip */}
                      {isSelected && (
                        <>
                          <button
                            onMouseDown={e => { e.stopPropagation(); removeField(fp.fieldId); }}
                            style={{
                              position: "absolute", top: -9, right: -9,
                              width: 16, height: 16, borderRadius: "50%",
                              background: "#ef4444", color: "white", border: "none",
                              cursor: "pointer", fontSize: 11, lineHeight: 1,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              zIndex: 30, fontWeight: "bold",
                            }}
                          >×</button>
                          <div
                            style={{
                              position: "absolute", top: -18, left: "50%",
                              transform: "translateX(-50%)",
                              background: "rgba(0,0,0,0.7)", color: "white",
                              fontSize: 9, padding: "1px 5px", borderRadius: 3,
                              whiteSpace: "nowrap", pointerEvents: "none", zIndex: 25,
                            }}
                          >
                            {fp.x}%, {fp.y}%
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar — properties + summary */}
        <div className="w-56 border-l bg-background flex flex-col overflow-hidden shrink-0">
          <div className="px-3 py-2 border-b bg-muted/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedFp ? ALL_FIELDS.find(f => f.id === selectedFp.fieldId)?.label : "Properties"}
            </p>
          </div>

          {selectedFp ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X (%)</Label>
                  <Input type="number" value={selectedFp.x}
                    onChange={e => updateFieldProp(selectedFp.fieldId, "x", parseFloat(e.target.value) || 0)}
                    min={0} max={100} step={0.5} className="h-7 text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Y (%)</Label>
                  <Input type="number" value={selectedFp.y}
                    onChange={e => updateFieldProp(selectedFp.fieldId, "y", parseFloat(e.target.value) || 0)}
                    min={0} max={100} step={0.5} className="h-7 text-xs" />
                </div>
              </div>

              <div>
                <Label className="text-xs">Font Size (px)</Label>
                <Input type="number" value={selectedFp.fontSize}
                  onChange={e => updateFieldProp(selectedFp.fieldId, "fontSize", parseInt(e.target.value) || 11)}
                  min={6} max={48} className="h-7 text-xs" />
              </div>

              <div>
                <Label className="text-xs">Alignment</Label>
                <Select value={selectedFp.alignment} onValueChange={v => updateFieldProp(selectedFp.fieldId, "alignment", v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Text Color</Label>
                <div className="flex gap-1.5 mt-1">
                  <input type="color" value={selectedFp.fontColor}
                    onChange={e => updateFieldProp(selectedFp.fieldId, "fontColor", e.target.value)}
                    className="h-7 w-9 rounded border cursor-pointer p-0.5" />
                  <Input type="text" value={selectedFp.fontColor}
                    onChange={e => updateFieldProp(selectedFp.fieldId, "fontColor", e.target.value)}
                    className="h-7 text-xs font-mono flex-1" maxLength={7} />
                </div>
              </div>

              {/* Quick align buttons */}
              <div>
                <Label className="text-xs text-muted-foreground">Quick align X to:</Label>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {[25, 50, 75].map(v => (
                    <button key={v} onClick={() => updateFieldProp(selectedFp.fieldId, "x", v)}
                      className="text-xs px-2 py-0.5 rounded border border-border hover:bg-accent transition-colors">
                      {v}%
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="destructive" size="sm" className="w-full h-7 text-xs"
                onClick={() => removeField(selectedFp.fieldId)}>
                <Trash2 className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <GripVertical className="h-8 w-8 mb-2 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">Pick a field and click the template, or drag a placed field to move it.</p>
              <p className="text-xs text-muted-foreground mt-2">Yellow lines = alignment with other fields. Orange = snap to grid.</p>
            </div>
          )}

          {/* Placed fields list */}
          <div className="border-t">
            <div className="px-3 py-1.5 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground">Placed ({fieldPositions.length})</p>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {fieldPositions.map(fp => {
                const field = ALL_FIELDS.find(f => f.id === fp.fieldId);
                return (
                  <div
                    key={fp.fieldId}
                    onClick={() => setSelectedFieldId(fp.fieldId)}
                    className={`flex items-center justify-between px-3 py-1 cursor-pointer transition-colors border-b border-border/30 text-xs ${
                      selectedFieldId === fp.fieldId ? "bg-primary/10 text-primary" : "hover:bg-accent"
                    }`}
                  >
                    <span className="truncate">{field?.label}</span>
                    <span className="text-muted-foreground ml-1 shrink-0 font-mono text-[10px]">{fp.x},{fp.y}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
