import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Trash2, Printer } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createSanitizedPdfClone, cleanupSanitizedClone, validateNoModernCss } from "@/lib/pdfSanitizerEngine";
import { toast } from "sonner";

interface DamageMark {
  id: string;
  x: number;
  y: number;
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
}

interface CarDamageInspectionProps {
  onComplete: (damageMarks: DamageMark[], signatureData: string, fuelLevel: string) => void;
  onCancel: () => void;
  onBack?: () => void;
  contractData?: ContractData;
}

export default function CarDamageInspection({ onComplete, onCancel, onBack, contractData }: CarDamageInspectionProps) {
  const [damageMarks, setDamageMarks] = useState<DamageMark[]>([]);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [markDescription, setMarkDescription] = useState("");
  const [fuelLevel, setFuelLevel] = useState<string>("Full");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const carDiagramRef = useRef<HTMLDivElement>(null);

  const handleCarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!carDiagramRef.current) return;
    
    const rect = carDiagramRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newMark: DamageMark = {
      id: `mark-${Date.now()}`,
      x,
      y,
      description: "",
    };

    setDamageMarks([...damageMarks, newMark]);
    setSelectedMark(newMark.id);
    setMarkDescription("");
  };

  const handleUpdateDescription = () => {
    if (!selectedMark) return;
    
    setDamageMarks(damageMarks.map(mark => 
      mark.id === selectedMark 
        ? { ...mark, description: markDescription }
        : mark
    ));
    setSelectedMark(null);
    setMarkDescription("");
  };

  const handleDeleteMark = (id: string) => {
    setDamageMarks(damageMarks.filter(mark => mark.id !== id));
    if (selectedMark === id) {
      setSelectedMark(null);
      setMarkDescription("");
    }
  };



  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    onComplete(damageMarks, "", fuelLevel);
  };

  return (
    <div className="space-y-6">
      {/* Contract Details Section - Printable */}
      {contractData && (
        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Rental Contract</CardTitle>
            <p className="text-sm text-gray-600">Contract Date: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Client Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Full Name</Label>
                  <p className="font-medium">{contractData.clientName}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">License Number</Label>
                  <p className="font-medium">{contractData.clientLicense}</p>
                </div>
                {contractData.clientPhone && (
                  <div>
                    <Label className="text-sm text-gray-600">Phone Number</Label>
                    <p className="font-medium">{contractData.clientPhone}</p>
                  </div>
                )}
                {contractData.clientAddress && (
                  <div>
                    <Label className="text-sm text-gray-600">Address</Label>
                    <p className="font-medium">{contractData.clientAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Vehicle Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Plate Number</Label>
                  <p className="font-medium">{contractData.vehiclePlate}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Brand</Label>
                  <p className="font-medium">{contractData.vehicleBrand}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Model</Label>
                  <p className="font-medium">{contractData.vehicleModel}</p>
                </div>
                {contractData.vehicleColor && (
                  <div>
                    <Label className="text-sm text-gray-600">Color</Label>
                    <p className="font-medium">{contractData.vehicleColor}</p>
                  </div>
                )}
                {contractData.vehicleVin && (
                  <div className="col-span-2">
                    <Label className="text-sm text-gray-600">VIN Number</Label>
                    <p className="font-medium font-mono">{contractData.vehicleVin}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rental Period */}
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Rental Period</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Start Date</Label>
                  <p className="font-medium">{contractData.startDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Return Date</Label>
                  <p className="font-medium">{contractData.endDate.toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Rental Days</Label>
                  <p className="font-medium">{contractData.rentalDays} days</p>
                </div>
              </div>
            </div>

            {/* Pricing Details */}
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Pricing Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm text-gray-600">Daily Rate</Label>
                  <p className="font-medium">${contractData.dailyRate.toFixed(2)}</p>
                </div>
                <div className="flex justify-between">
                  <Label className="text-sm text-gray-600">Total Amount ({contractData.rentalDays} days × ${contractData.dailyRate})</Label>
                  <p className="font-medium">${contractData.totalAmount.toFixed(2)}</p>
                </div>
                {contractData.discount > 0 && (
                  <div className="flex justify-between">
                    <Label className="text-sm text-gray-600">Discount</Label>
                    <p className="font-medium text-green-600">-${contractData.discount.toFixed(2)}</p>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 mt-2">
                  <Label className="text-base font-semibold">Final Amount</Label>
                  <p className="text-lg font-bold text-primary">${contractData.finalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Car Damage Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Condition Inspection</CardTitle>
          <p className="text-sm text-gray-600">Click on the car diagram to mark any existing damages</p>
        </CardHeader>
        <CardContent>
          <div 
            ref={carDiagramRef}
            className="relative w-full aspect-[4/3] bg-gray-100 rounded-lg border-2 border-gray-300 cursor-crosshair overflow-hidden"
            onClick={handleCarClick}
          >
            {/* Realistic Car SVG Diagram - Top View */}
            <svg
              viewBox="0 0 800 600"
              className="w-full h-full pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Car Body - Top View with realistic proportions */}
              <defs>
                <linearGradient id="carBodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{stopColor: "#c8c8c8", stopOpacity: 1}} />
                  <stop offset="50%" style={{stopColor: "#e8e8e8", stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: "#c8c8c8", stopOpacity: 1}} />
                </linearGradient>
                <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{stopColor: "#a8d8ff", stopOpacity: 0.7}} />
                  <stop offset="100%" style={{stopColor: "#6bb6ff", stopOpacity: 0.9}} />
                </linearGradient>
              </defs>
              
              <g>
                {/* Main Car Body Outline */}
                <path
                  d="M 300 120 
                     L 320 100 L 480 100 L 500 120
                     L 520 140 L 520 200
                     L 540 220 L 540 380
                     L 520 400 L 520 460
                     L 500 480 L 480 500 L 320 500 L 300 480
                     L 280 460 L 280 400
                     L 260 380 L 260 220
                     L 280 200 L 280 140 Z"
                  fill="url(#carBodyGradient)"
                  stroke="#2c3e50"
                  strokeWidth="4"
                />
                
                {/* Front Windshield */}
                <path
                  d="M 310 125 L 325 110 L 475 110 L 490 125 L 490 180 L 310 180 Z"
                  fill="url(#glassGradient)"
                  stroke="#34495e"
                  strokeWidth="3"
                />
                
                {/* Hood */}
                <rect x="310" y="190" width="180" height="120" rx="8" fill="#d5d5d5" stroke="#34495e" strokeWidth="2"/>
                <line x1="400" y1="195" x2="400" y2="305" stroke="#bbb" strokeWidth="1" strokeDasharray="5,5"/>
                
                {/* Roof/Cabin */}
                <rect x="310" y="320" width="180" height="60" rx="5" fill="#e0e0e0" stroke="#34495e" strokeWidth="2"/>
                
                {/* Rear Windshield */}
                <path
                  d="M 310 390 L 310 420 L 325 435 L 475 435 L 490 420 L 490 390 Z"
                  fill="url(#glassGradient)"
                  stroke="#34495e"
                  strokeWidth="3"
                />
                
                {/* Trunk */}
                <rect x="310" y="445" width="180" height="40" rx="8" fill="#d5d5d5" stroke="#34495e" strokeWidth="2"/>
                
                {/* Front Wheels */}
                <g>
                  <ellipse cx="285" cy="240" rx="35" ry="50" fill="#1a1a1a" stroke="#000" strokeWidth="3"/>
                  <ellipse cx="285" cy="240" rx="25" ry="35" fill="#333" stroke="#666" strokeWidth="2"/>
                  <ellipse cx="285" cy="240" rx="12" ry="18" fill="#555"/>
                </g>
                <g>
                  <ellipse cx="515" cy="240" rx="35" ry="50" fill="#1a1a1a" stroke="#000" strokeWidth="3"/>
                  <ellipse cx="515" cy="240" rx="25" ry="35" fill="#333" stroke="#666" strokeWidth="2"/>
                  <ellipse cx="515" cy="240" rx="12" ry="18" fill="#555"/>
                </g>
                
                {/* Rear Wheels */}
                <g>
                  <ellipse cx="285" cy="360" rx="35" ry="50" fill="#1a1a1a" stroke="#000" strokeWidth="3"/>
                  <ellipse cx="285" cy="360" rx="25" ry="35" fill="#333" stroke="#666" strokeWidth="2"/>
                  <ellipse cx="285" cy="360" rx="12" ry="18" fill="#555"/>
                </g>
                <g>
                  <ellipse cx="515" cy="360" rx="35" ry="50" fill="#1a1a1a" stroke="#000" strokeWidth="3"/>
                  <ellipse cx="515" cy="360" rx="25" ry="35" fill="#333" stroke="#666" strokeWidth="2"/>
                  <ellipse cx="515" cy="360" rx="12" ry="18" fill="#555"/>
                </g>
                
                {/* Side Mirrors */}
                <ellipse cx="265" cy="300" rx="18" ry="28" fill="#7f8c8d" stroke="#34495e" strokeWidth="2"/>
                <ellipse cx="535" cy="300" rx="18" ry="28" fill="#7f8c8d" stroke="#34495e" strokeWidth="2"/>
                
                {/* Headlights */}
                <ellipse cx="340" cy="105" rx="15" ry="8" fill="#fff9e6" stroke="#34495e" strokeWidth="2"/>
                <ellipse cx="460" cy="105" rx="15" ry="8" fill="#fff9e6" stroke="#34495e" strokeWidth="2"/>
                
                {/* Taillights */}
                <ellipse cx="340" cy="495" rx="15" ry="8" fill="#ff4444" stroke="#34495e" strokeWidth="2"/>
                <ellipse cx="460" cy="495" rx="15" ry="8" fill="#ff4444" stroke="#34495e" strokeWidth="2"/>
                
                {/* Door Lines */}
                <line x1="310" y1="200" x2="310" y2="380" stroke="#95a5a6" strokeWidth="2"/>
                <line x1="490" y1="200" x2="490" y2="380" stroke="#95a5a6" strokeWidth="2"/>
                <line x1="395" y1="200" x2="395" y2="380" stroke="#95a5a6" strokeWidth="2" strokeDasharray="4,4"/>
                
                {/* Labels */}
                <text x="400" y="80" textAnchor="middle" fill="#2c3e50" fontSize="20" fontWeight="bold">⬆ FRONT</text>
                <text x="400" y="250" textAnchor="middle" fill="#555" fontSize="14" fontWeight="600">HOOD</text>
                <text x="400" y="350" textAnchor="middle" fill="#555" fontSize="12">CABIN</text>
                <text x="400" y="465" textAnchor="middle" fill="#555" fontSize="14" fontWeight="600">TRUNK</text>
                <text x="400" y="530" textAnchor="middle" fill="#2c3e50" fontSize="20" fontWeight="bold">REAR ⬇</text>
                
                <text x="220" y="300" textAnchor="middle" fill="#2c3e50" fontSize="14" fontWeight="600" transform="rotate(-90 220 300)">◀ LEFT SIDE</text>
                <text x="580" y="300" textAnchor="middle" fill="#2c3e50" fontSize="14" fontWeight="600" transform="rotate(90 580 300)">RIGHT SIDE ▶</text>
              </g>
            </svg>

            {/* Damage Marks */}
            {damageMarks.map((mark, index) => (
              <div
                key={mark.id}
                className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all font-bold text-xs ${
                  selectedMark === mark.id
                    ? "bg-red-500 border-red-700 scale-125 text-white"
                    : "bg-red-400 border-red-600 hover:scale-110 text-white"
                }`}
                style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMark(mark.id);
                  setMarkDescription(mark.description);
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>

          {/* Damage Marks List */}
          {damageMarks.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-sm">Marked Damages ({damageMarks.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {damageMarks.map((mark, index) => (
                  <div key={mark.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded border">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Mark #{index + 1}</div>
                      {mark.description && (
                        <div className="text-xs text-gray-600">{mark.description}</div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMark(mark.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description Input for Selected Mark */}
          {selectedMark && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label htmlFor="markDescription">Describe the damage</Label>
              <div className="flex gap-2 mt-2">
                <Textarea
                  id="markDescription"
                  value={markDescription}
                  onChange={(e) => setMarkDescription(e.target.value)}
                  placeholder="e.g., Small scratch on door, Dent on bumper..."
                  className="flex-1"
                  rows={2}
                />
                <Button type="button" onClick={handleUpdateDescription}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fuel Level Indicator */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Level at Rental Start</CardTitle>
          <p className="text-sm text-gray-600">Select the current fuel level in the vehicle</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {["Empty", "1/4", "1/2", "3/4", "Full"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFuelLevel(level)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                    fuelLevel === level
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            {/* Visual Fuel Gauge */}
            <div className="mt-4">
              <div className="relative h-12 bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300"
                  style={{
                    width:
                      fuelLevel === "Empty"
                        ? "0%"
                        : fuelLevel === "1/4"
                        ? "25%"
                        : fuelLevel === "1/2"
                        ? "50%"
                        : fuelLevel === "3/4"
                        ? "75%"
                        : "100%",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-700 drop-shadow-md">
                    {fuelLevel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printable Signature Field */}
      <Card>
        <CardHeader>
          <CardTitle>Client Signature</CardTitle>
          <p className="text-sm text-gray-600">This contract will be printed for the client to sign with pen</p>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-gray-300 rounded-lg bg-white p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Client Signature:</Label>
              <div className="border-b-2 border-gray-400 h-20 relative">
                <span className="absolute bottom-0 left-0 text-xs text-gray-400 italic">Sign here with pen when printed</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date:</Label>
                <div className="border-b-2 border-gray-400 h-10 flex items-end pb-1">
                  <span className="text-sm text-gray-600">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Print Name:</Label>
                <div className="border-b-2 border-gray-400 h-10">
                  <span className="absolute text-xs text-gray-400 italic mt-6">Print full name</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Action Buttons */}
      <div className="flex justify-between gap-4 print:hidden">
        <div className="flex gap-2">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              Back to Contract
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => window.print()}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Inspection
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            className="bg-black hover:bg-gray-800 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Completing..." : "Complete Contract"}
          </Button>
        </div>
      </div>
    </div>
  );
}
