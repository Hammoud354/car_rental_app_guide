import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";

type CarView = "front" | "rear" | "left" | "right";

interface DamageMark {
  id: string;
  x: number;
  y: number;
  view: CarView;
  description: string;
}

interface ContractData {
  clientName: string;
  clientLicense: string;
  clientPhone?: string;
  clientAddress?: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor?: string;
  vehicleVin?: string;
  startDate: Date;
  endDate: Date;
  rentalDays: number;
  dailyRate: number;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  insurancePackage?: "None" | "Basic" | "Premium" | "Full Coverage";
  insuranceCost?: number;
  insuranceDailyRate?: number;
  depositAmount?: number;
  depositStatus?: "None" | "Held" | "Refunded" | "Forfeited";
  fuelPolicy?: "Full-to-Full" | "Same-to-Same" | "Pre-purchase";
}

interface CarDamageInspectionProps {
  onComplete: (damageMarks: DamageMark[], signatureData: string, fuelLevel: string) => void;
  onCancel: () => void;
  onBack?: () => void;
  contractData?: ContractData;
}

const VIEW_LABELS: Record<CarView, string> = {
  front: "Front",
  rear: "Rear",
  left: "Left Side",
  right: "Right Side",
};

/*
  The source image (car-schema.jpeg, 612×612) has this layout:
    Row 1 (y 0–33%):       Left side view  — full width
    Row 2 (y 33–66%):      Right side view — full width
    Row 3 left (y 66–100%, x 0–50%):  Front view
    Row 3 right (y 66–100%, x 50–100%): Rear view

  We crop each region by setting background-size & background-position.
*/
const VIEW_STYLE: Record<CarView, { bgSize: string; bgPos: string; aspect: string }> = {
  left:  { bgSize: "100% 300%",  bgPos: "50% 0%",   aspect: "3 / 1" },
  right: { bgSize: "100% 300%",  bgPos: "50% 50%",  aspect: "3 / 1" },
  front: { bgSize: "200% 300%",  bgPos: "0% 100%",  aspect: "3 / 2" },
  rear:  { bgSize: "200% 300%",  bgPos: "100% 100%",aspect: "3 / 2" },
};

/* ─── Single clickable panel ─────────────────────── */
interface ViewPanelProps {
  view: CarView;
  marks: DamageMark[];
  allMarks: DamageMark[];
  selectedMark: string | null;
  onPanelClick: (view: CarView, x: number, y: number) => void;
  onMarkClick: (id: string, description: string) => void;
}

function ViewPanel({ view, marks, allMarks, selectedMark, onPanelClick, onMarkClick }: ViewPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { bgSize, bgPos, aspect } = VIEW_STYLE[view];
  const viewMarks = marks.filter(m => m.view === view);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    onPanelClick(view, ((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100);
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-center text-muted-foreground uppercase tracking-widest">
        {VIEW_LABELS[view]}
      </span>
      <div
        ref={ref}
        className="relative rounded-xl border border-slate-200 cursor-crosshair overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white"
        style={{
          aspectRatio: aspect,
          backgroundImage: "url(/car-schema.jpeg)",
          backgroundSize: bgSize,
          backgroundPosition: bgPos,
          backgroundRepeat: "no-repeat",
        }}
        onClick={handleClick}
      >
        {viewMarks.map(mark => {
          const idx = allMarks.findIndex(m => m.id === mark.id) + 1;
          return (
            <div
              key={mark.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center cursor-pointer text-white font-bold text-xs transition-all shadow-lg ${
                selectedMark === mark.id
                  ? "bg-red-600 scale-125 ring-2 ring-red-300"
                  : "bg-red-500 hover:scale-110"
              }`}
              style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
              onClick={e => { e.stopPropagation(); onMarkClick(mark.id, mark.description); }}
            >
              {idx}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────── */
export default function CarDamageInspection({ onComplete, onCancel, onBack, contractData }: CarDamageInspectionProps) {
  const [damageMarks, setDamageMarks] = useState<DamageMark[]>([]);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [markDescription, setMarkDescription] = useState("");
  const [fuelLevel, setFuelLevel] = useState("Full");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePanelClick = (view: CarView, x: number, y: number) => {
    if (selectedMark) {
      setDamageMarks(p => p.map(m => m.id === selectedMark ? { ...m, description: markDescription } : m));
      setSelectedMark(null);
      setMarkDescription("");
    }
    const mark: DamageMark = { id: `mark-${Date.now()}`, x, y, view, description: "" };
    setDamageMarks(p => [...p, mark]);
    setSelectedMark(mark.id);
    setMarkDescription("");
  };

  const handleMarkClick = (id: string, description: string) => { setSelectedMark(id); setMarkDescription(description); };

  const handleSave = () => {
    if (!selectedMark) return;
    setDamageMarks(p => p.map(m => m.id === selectedMark ? { ...m, description: markDescription } : m));
    setSelectedMark(null); setMarkDescription("");
  };

  const handleDelete = (id: string) => {
    setDamageMarks(p => p.filter(m => m.id !== id));
    if (selectedMark === id) { setSelectedMark(null); setMarkDescription(""); }
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onComplete(damageMarks, "", fuelLevel);
    // Reset after a tick so the button re-enables if the parent doesn't unmount (e.g. on error)
    setTimeout(() => setIsSubmitting(false), 1500);
  };

  const panelProps = { marks: damageMarks, allMarks: damageMarks, selectedMark, onPanelClick: handlePanelClick, onMarkClick: handleMarkClick };

  return (
    <div className="space-y-6">
      {/* Contract details */}
      {contractData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Rental Contract</CardTitle>
            <p className="text-sm text-gray-600">Contract Date: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Client Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm text-gray-600">Full Name</Label><p className="font-medium">{contractData.clientName}</p></div>
                <div><Label className="text-sm text-gray-600">License Number</Label><p className="font-medium">{contractData.clientLicense}</p></div>
                {contractData.clientPhone && <div><Label className="text-sm text-gray-600">Phone</Label><p className="font-medium">{contractData.clientPhone}</p></div>}
                {contractData.clientAddress && <div><Label className="text-sm text-gray-600">Address</Label><p className="font-medium">{contractData.clientAddress}</p></div>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Vehicle Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-sm text-gray-600">Plate</Label><p className="font-medium">{contractData.vehiclePlate}</p></div>
                <div><Label className="text-sm text-gray-600">Brand</Label><p className="font-medium">{contractData.vehicleBrand}</p></div>
                <div><Label className="text-sm text-gray-600">Model</Label><p className="font-medium">{contractData.vehicleModel}</p></div>
                {contractData.vehicleColor && <div><Label className="text-sm text-gray-600">Color</Label><p className="font-medium">{contractData.vehicleColor}</p></div>}
                {contractData.vehicleVin && <div className="col-span-2"><Label className="text-sm text-gray-600">VIN</Label><p className="font-medium font-mono">{contractData.vehicleVin}</p></div>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Rental Period</h3>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-sm text-gray-600">Start</Label><p className="font-medium">{contractData.startDate.toLocaleDateString()}</p></div>
                <div><Label className="text-sm text-gray-600">Return</Label><p className="font-medium">{contractData.endDate.toLocaleDateString()}</p></div>
                <div><Label className="text-sm text-gray-600">Days</Label><p className="font-medium">{contractData.rentalDays}</p></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Pricing</h3>
              <div className="space-y-2">
                <div className="flex justify-between"><Label className="text-sm text-gray-600">Daily Rate</Label><p className="font-medium">${contractData.dailyRate.toFixed(2)}</p></div>
                <div className="flex justify-between"><Label className="text-sm text-gray-600">Total ({contractData.rentalDays}d)</Label><p className="font-medium">${contractData.totalAmount.toFixed(2)}</p></div>
                {contractData.discount > 0 && <div className="flex justify-between"><Label className="text-sm text-gray-600">Discount</Label><p className="font-medium text-green-600">-${contractData.discount.toFixed(2)}</p></div>}
                <div className="flex justify-between border-t pt-2"><Label className="font-semibold">Final Amount</Label><p className="text-lg font-bold text-primary">${contractData.finalAmount.toFixed(2)}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4-panel inspection */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Condition Inspection</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on any panel to mark existing damage. Click a marker again to describe it.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Side views — full width each */}
          <div className="grid grid-cols-1 gap-4">
            <ViewPanel view="left"  {...panelProps} />
            <ViewPanel view="right" {...panelProps} />
          </div>

          {/* Front / Rear — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <ViewPanel view="front" {...panelProps} />
            <ViewPanel view="rear"  {...panelProps} />
          </div>

          {/* Description editor */}
          {selectedMark && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <Label className="text-sm font-medium">
                Damage #{damageMarks.findIndex(m => m.id === selectedMark) + 1}
                {" — "}
                <span className="text-muted-foreground">{VIEW_LABELS[damageMarks.find(m => m.id === selectedMark)?.view ?? "front"]}</span>
              </Label>
              <div className="flex gap-2 mt-2">
                <Textarea
                  value={markDescription}
                  onChange={e => setMarkDescription(e.target.value)}
                  placeholder="e.g., Scratch on door panel, dent on bumper…"
                  className="flex-1" rows={2}
                />
                <Button type="button" onClick={handleSave}>Save</Button>
              </div>
            </div>
          )}

          {/* Damage list */}
          {damageMarks.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Marked Damages ({damageMarks.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {damageMarks.map((mark, i) => (
                  <div key={mark.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{VIEW_LABELS[mark.view]}</div>
                      <div className="text-xs text-muted-foreground truncate">{mark.description || <em>No description added</em>}</div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(mark.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fuel Level */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Level at Rental Start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {["Empty", "1/4", "1/2", "3/4", "Full"].map(l => (
              <button key={l} type="button" onClick={() => setFuelLevel(l)}
                className={`flex-1 py-3 px-2 rounded-lg border-2 text-sm transition-all ${fuelLevel === l ? "border-primary bg-primary/10 font-semibold" : "border-gray-300 hover:border-gray-400"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="relative h-10 bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300">
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300"
              style={{ width: fuelLevel === "Empty" ? "0%" : fuelLevel === "1/4" ? "25%" : fuelLevel === "1/2" ? "50%" : fuelLevel === "3/4" ? "75%" : "100%" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-700 drop-shadow">{fuelLevel}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature */}
      <Card>
        <CardHeader><CardTitle>Client Signature</CardTitle></CardHeader>
        <CardContent>
          <div className="border-2 border-gray-300 rounded-lg bg-white p-8 space-y-6">
            <div className="space-y-2">
              <Label>Client Signature:</Label>
              <div className="border-b-2 border-gray-400 h-20 relative">
                <span className="absolute bottom-0 left-0 text-xs text-gray-400 italic">Sign here with pen when printed</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date:</Label><div className="border-b-2 border-gray-400 h-10" /></div>
              <div className="space-y-2"><Label>Agent Signature:</Label><div className="border-b-2 border-gray-400 h-10" /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onBack && <Button type="button" variant="outline" onClick={onBack}>Back</Button>}
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Complete Inspection"}
        </Button>
      </div>
    </div>
  );
}
