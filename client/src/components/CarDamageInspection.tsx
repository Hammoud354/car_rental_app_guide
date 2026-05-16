import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";

export type MarkSymbol = "X" | "O" | "dot";
export type CarView = "front" | "rear" | "left" | "right";

export interface DamageMark {
  id: string;
  x: number;
  y: number;
  view: CarView;
  description: string;
  symbol: MarkSymbol;
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

/* Left / Right use the existing car-schema.png (2×2 grid, top half only).
   Front / Rear are rendered as inline SVGs since the image bottom half is blank. */
const SIDE_BG_POS: Partial<Record<CarView, string>> = {
  left:  "0% 0%",
  right: "100% 0%",
};

function FrontCarSVG() {
  return (
    <svg viewBox="0 0 420 260" className="absolute inset-0 w-full h-full" style={{ padding: "6px" }}>
      {/* ── Roof ── */}
      <path d="M145 42 Q210 34 275 42" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round"/>

      {/* ── A-pillars (roof → hood corners) ── */}
      <path d="M145 42 L92 98 Q210 90 328 98 L275 42" fill="none" stroke="#444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>

      {/* ── Windshield glass ── */}
      <path d="M147 42 L96 96 L324 96 L273 42 Z" fill="none" stroke="#555" strokeWidth="1.4"/>

      {/* ── Hood surface (below windshield) ── */}
      <path d="M92 98 Q210 92 328 98 L340 115 Q210 108 80 115 Z" fill="none" stroke="#444" strokeWidth="2"/>

      {/* ── Left outer fender / body side ── */}
      <path d="M80 115 Q52 120 28 138 Q16 148 16 165 L16 195 Q16 204 26 206 L90 208" fill="none" stroke="#444" strokeWidth="2.2" strokeLinecap="round"/>

      {/* ── Right outer fender / body side ── */}
      <path d="M340 115 Q368 120 392 138 Q404 148 404 165 L404 195 Q404 204 394 206 L330 208" fill="none" stroke="#444" strokeWidth="2.2" strokeLinecap="round"/>

      {/* ── Bumper (bottom) ── */}
      <path d="M26 206 Q210 214 394 206" fill="none" stroke="#444" strokeWidth="2.2"/>

      {/* ── Left headlight (angular, outer corner) ── */}
      <path d="M18 140 L18 172 Q18 178 26 178 L80 174 L82 112 Q48 112 18 140 Z" fill="none" stroke="#444" strokeWidth="1.8"/>
      <line x1="24" y1="143" x2="79" y2="140" stroke="#555" strokeWidth="1.1" strokeDasharray="7,4"/>
      <line x1="24" y1="156" x2="79" y2="153" stroke="#555" strokeWidth="1.1"/>

      {/* ── Right headlight ── */}
      <path d="M402 140 L402 172 Q402 178 394 178 L340 174 L338 112 Q372 112 402 140 Z" fill="none" stroke="#444" strokeWidth="1.8"/>
      <line x1="396" y1="143" x2="341" y2="140" stroke="#555" strokeWidth="1.1" strokeDasharray="7,4"/>
      <line x1="396" y1="156" x2="341" y2="153" stroke="#555" strokeWidth="1.1"/>

      {/* ── Central grille ── */}
      <path d="M83 118 Q210 124 337 118 L337 178 Q210 182 83 178 Z" fill="none" stroke="#444" strokeWidth="1.6"/>
      <line x1="84" y1="136" x2="336" y2="136" stroke="#555" strokeWidth="0.9"/>
      <line x1="84" y1="153" x2="336" y2="153" stroke="#555" strokeWidth="0.9"/>
      <line x1="84" y1="170" x2="336" y2="170" stroke="#555" strokeWidth="0.9"/>

      {/* ── License plate ── */}
      <rect x="162" y="182" width="96" height="22" rx="2" fill="none" stroke="#444" strokeWidth="1.6"/>

      {/* ── Fog lights ── */}
      <rect x="28" y="182" width="44" height="18" rx="4" fill="none" stroke="#444" strokeWidth="1.2"/>
      <rect x="348" y="182" width="44" height="18" rx="4" fill="none" stroke="#444" strokeWidth="1.2"/>

      {/* ── Left wheel arch + tyre ── */}
      <path d="M16 200 Q70 188 124 200" fill="none" stroke="#444" strokeWidth="2"/>
      <ellipse cx="70" cy="232" rx="54" ry="17" fill="none" stroke="#444" strokeWidth="2"/>
      <ellipse cx="70" cy="232" rx="30" ry="9" fill="none" stroke="#555" strokeWidth="1.5"/>

      {/* ── Right wheel arch + tyre ── */}
      <path d="M296 200 Q350 188 404 200" fill="none" stroke="#444" strokeWidth="2"/>
      <ellipse cx="350" cy="232" rx="54" ry="17" fill="none" stroke="#444" strokeWidth="2"/>
      <ellipse cx="350" cy="232" rx="30" ry="9" fill="none" stroke="#555" strokeWidth="1.5"/>
    </svg>
  );
}

function RearCarSVG() {
  return (
    <svg viewBox="0 0 420 260" className="absolute inset-0 w-full h-full" style={{ padding: "6px" }}>
      {/* ── Roof ── */}
      <path d="M145 42 Q210 34 275 42" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round"/>

      {/* ── C-pillars (roof → trunk corners) ── */}
      <path d="M145 42 L92 98 Q210 90 328 98 L275 42" fill="none" stroke="#444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>

      {/* ── Rear windshield glass ── */}
      <path d="M149 42 L100 96 L320 96 L271 42 Z" fill="none" stroke="#555" strokeWidth="1.4"/>

      {/* ── Trunk lid (below rear windshield) ── */}
      <path d="M92 98 Q210 92 328 98 L340 115 Q210 108 80 115 Z" fill="none" stroke="#444" strokeWidth="2"/>

      {/* ── Trunk handle ── */}
      <path d="M172 100 Q210 105 248 100" fill="none" stroke="#555" strokeWidth="1.5"/>

      {/* ── Left outer fender / body side ── */}
      <path d="M80 115 Q52 120 28 138 Q16 148 16 165 L16 195 Q16 204 26 206 L90 208" fill="none" stroke="#444" strokeWidth="2.2" strokeLinecap="round"/>

      {/* ── Right outer fender / body side ── */}
      <path d="M340 115 Q368 120 392 138 Q404 148 404 165 L404 195 Q404 204 394 206 L330 208" fill="none" stroke="#444" strokeWidth="2.2" strokeLinecap="round"/>

      {/* ── Bumper (bottom) ── */}
      <path d="M26 206 Q210 214 394 206" fill="none" stroke="#444" strokeWidth="2.2"/>

      {/* ── Left tail light (horizontal lines = LEDs) ── */}
      <path d="M18 138 L18 176 Q18 182 26 182 L82 178 L84 110 Q48 110 18 138 Z" fill="none" stroke="#444" strokeWidth="1.8"/>
      <line x1="24" y1="138" x2="81" y2="134" stroke="#555" strokeWidth="1.4"/>
      <line x1="24" y1="150" x2="81" y2="146" stroke="#555" strokeWidth="1.4"/>
      <line x1="24" y1="162" x2="81" y2="158" stroke="#555" strokeWidth="1.4"/>
      <line x1="24" y1="174" x2="81" y2="170" stroke="#555" strokeWidth="1.4"/>

      {/* ── Right tail light ── */}
      <path d="M402 138 L402 176 Q402 182 394 182 L338 178 L336 110 Q372 110 402 138 Z" fill="none" stroke="#444" strokeWidth="1.8"/>
      <line x1="396" y1="138" x2="339" y2="134" stroke="#555" strokeWidth="1.4"/>
      <line x1="396" y1="150" x2="339" y2="146" stroke="#555" strokeWidth="1.4"/>
      <line x1="396" y1="162" x2="339" y2="158" stroke="#555" strokeWidth="1.4"/>
      <line x1="396" y1="174" x2="339" y2="170" stroke="#555" strokeWidth="1.4"/>

      {/* ── Rear fascia / lower bumper face ── */}
      <path d="M85 118 Q210 124 335 118 L335 182 Q210 186 85 182 Z" fill="none" stroke="#444" strokeWidth="1.6"/>

      {/* ── License plate (centered, large) ── */}
      <rect x="148" y="126" width="124" height="30" rx="2" fill="none" stroke="#444" strokeWidth="1.8"/>

      {/* ── Exhaust pipes ── */}
      <ellipse cx="52" cy="200" rx="14" ry="8" fill="none" stroke="#444" strokeWidth="1.5"/>
      <ellipse cx="368" cy="200" rx="14" ry="8" fill="none" stroke="#444" strokeWidth="1.5"/>

      {/* ── Left wheel arch + tyre ── */}
      <path d="M16 200 Q70 188 124 200" fill="none" stroke="#444" strokeWidth="2"/>
      <ellipse cx="70" cy="232" rx="54" ry="17" fill="none" stroke="#444" strokeWidth="2"/>
      <ellipse cx="70" cy="232" rx="30" ry="9" fill="none" stroke="#555" strokeWidth="1.5"/>

      {/* ── Right wheel arch + tyre ── */}
      <path d="M296 200 Q350 188 404 200" fill="none" stroke="#444" strokeWidth="2"/>
      <ellipse cx="350" cy="232" rx="54" ry="17" fill="none" stroke="#444" strokeWidth="2"/>
      <ellipse cx="350" cy="232" rx="30" ry="9" fill="none" stroke="#555" strokeWidth="1.5"/>
    </svg>
  );
}

/* ── Render a single symbol at given size ─── */
function SymbolBadge({
  symbol, index, selected, size = 28
}: { symbol: MarkSymbol; index: number; selected?: boolean; size?: number }) {
  const s = size;
  const r = s / 2 - 1;
  const cx = s / 2, cy = s / 2;
  const pad = s * 0.22;

  return (
    <svg
      width={s} height={s}
      style={{
        overflow: "visible",
        filter: selected ? "drop-shadow(0 0 3px rgba(0,0,0,0.5))" : undefined,
      }}
    >
      <circle cx={cx} cy={cy} r={r}
        fill={selected ? "#111" : "white"}
        stroke="black" strokeWidth={1.6}
      />
      {symbol === "X" && (
        <>
          <line x1={cx - r + pad} y1={cy - r + pad} x2={cx + r - pad} y2={cy + r - pad}
            stroke={selected ? "white" : "black"} strokeWidth={1.8} strokeLinecap="round" />
          <line x1={cx + r - pad} y1={cy - r + pad} x2={cx - r + pad} y2={cy + r - pad}
            stroke={selected ? "white" : "black"} strokeWidth={1.8} strokeLinecap="round" />
        </>
      )}
      {symbol === "O" && (
        <circle cx={cx} cy={cy} r={r - pad}
          fill="none" stroke={selected ? "white" : "black"} strokeWidth={1.8} />
      )}
      {symbol === "dot" && (
        <circle cx={cx} cy={cy} r={r * 0.38}
          fill={selected ? "white" : "black"} />
      )}
      {/* index number */}
      <text x={cx} y={cy + 3.5} textAnchor="middle" fontSize={s * 0.3}
        fontWeight="bold" fill={selected ? "white" : "black"}
        fontFamily="sans-serif"
      >{index}</text>
    </svg>
  );
}

/* ── Single clickable view panel ─── */
interface ViewPanelProps {
  view: CarView;
  marks: DamageMark[];
  allMarks: DamageMark[];
  selectedMark: string | null;
  onPanelClick: (view: CarView, x: number, y: number) => void;
  onMarkClick: (id: string) => void;
}

function ViewPanel({ view, marks, allMarks, selectedMark, onPanelClick, onMarkClick }: ViewPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const bgPos = SIDE_BG_POS[view];
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
          aspectRatio: "3 / 2",
          ...(bgPos ? {
            backgroundImage: "url('/car-schema.png')",
            backgroundSize: "200% 200%",
            backgroundPosition: bgPos,
            backgroundRepeat: "no-repeat",
          } : {}),
        }}
        onClick={handleClick}
      >
        {/* Inline SVG for front/rear views (image has no bottom-half content) */}
        {view === "front" && <FrontCarSVG />}
        {view === "rear" && <RearCarSVG />}

        {viewMarks.map(mark => {
          const idx = allMarks.findIndex(m => m.id === mark.id) + 1;
          const isSelected = selectedMark === mark.id;
          return (
            <div
              key={mark.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110"
              style={{ left: `${mark.x}%`, top: `${mark.y}%`, zIndex: 10 }}
              onClick={e => { e.stopPropagation(); onMarkClick(mark.id); }}
            >
              <SymbolBadge symbol={mark.symbol} index={idx} selected={isSelected} size={26} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ─── */
export default function CarDamageInspection({ onComplete, onCancel, onBack, contractData }: CarDamageInspectionProps) {
  const [damageMarks, setDamageMarks] = useState<DamageMark[]>([]);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [markDescription, setMarkDescription] = useState("");
  const activeSymbol: MarkSymbol = "X";
  const [fuelLevel, setFuelLevel] = useState("Full");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePanelClick = (view: CarView, x: number, y: number) => {
    if (selectedMark) {
      setDamageMarks(p => p.map(m => m.id === selectedMark ? { ...m, description: markDescription } : m));
      setSelectedMark(null);
      setMarkDescription("");
    }
    const mark: DamageMark = { id: `mark-${Date.now()}`, x, y, view, description: "", symbol: activeSymbol };
    setDamageMarks(p => [...p, mark]);
    setSelectedMark(mark.id);
    setMarkDescription("");
  };

  const handleMarkClick = (id: string) => {
    if (selectedMark && selectedMark !== id) {
      setDamageMarks(p => p.map(m => m.id === selectedMark ? { ...m, description: markDescription } : m));
    }
    const mark = damageMarks.find(m => m.id === id);
    setSelectedMark(id);
    setMarkDescription(mark?.description ?? "");
  };

  const handleSave = () => {
    if (!selectedMark) return;
    setDamageMarks(p => p.map(m => m.id === selectedMark ? { ...m, description: markDescription } : m));
    setSelectedMark(null);
    setMarkDescription("");
  };

  const handleDelete = (id: string) => {
    setDamageMarks(p => p.filter(m => m.id !== id));
    if (selectedMark === id) { setSelectedMark(null); setMarkDescription(""); }
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    if (selectedMark) {
      setDamageMarks(p => p.map(m => m.id === selectedMark ? { ...m, description: markDescription } : m));
    }
    setIsSubmitting(true);
    onComplete(damageMarks, "", fuelLevel);
    setTimeout(() => setIsSubmitting(false), 1500);
  };

  const panelProps = { marks: damageMarks, allMarks: damageMarks, selectedMark, onPanelClick: handlePanelClick, onMarkClick: handleMarkClick };

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Condition Inspection</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click on any panel to mark existing damage. Click a marker again to add a description.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* All 4 views in a 2×2 grid */}
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
            <ViewPanel view="left"  {...panelProps} />
            <ViewPanel view="right" {...panelProps} />
            <ViewPanel view="front" {...panelProps} />
            <ViewPanel view="rear"  {...panelProps} />
          </div>

          {/* Description editor */}
          {selectedMark && (() => {
            const mark = damageMarks.find(m => m.id === selectedMark)!;
            const idx = damageMarks.findIndex(m => m.id === selectedMark) + 1;
            return (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 space-y-3">
                <div className="flex items-center gap-2">
                  <SymbolBadge symbol={mark.symbol} index={idx} selected size={24} />
                  <Label className="text-sm font-medium">
                    Damage #{idx} — <span className="text-muted-foreground">{VIEW_LABELS[mark.view]}</span>
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    value={markDescription}
                    onChange={e => setMarkDescription(e.target.value)}
                    placeholder="e.g., Scratch on door panel, dent on bumper…"
                    className="flex-1"
                    rows={2}
                  />
                  <Button type="button" onClick={handleSave}>Save</Button>
                </div>
              </div>
            );
          })()}

          {/* Damage list */}
          {damageMarks.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Marked Damages ({damageMarks.length})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {damageMarks.map((mark, i) => (
                  <div key={mark.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex-shrink-0 mt-0.5">
                      <SymbolBadge symbol={mark.symbol} index={i + 1} size={24} />
                    </div>
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
        <CardHeader><CardTitle>Fuel Level at Rental Start</CardTitle></CardHeader>
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
