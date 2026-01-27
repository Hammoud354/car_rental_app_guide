import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Trash2 } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

interface DamageMark {
  id: string;
  x: number;
  y: number;
  description: string;
}

interface CarDamageInspectionProps {
  onComplete: (damageMarks: DamageMark[], signatureData: string) => void;
  onCancel: () => void;
}

export default function CarDamageInspection({ onComplete, onCancel }: CarDamageInspectionProps) {
  const [damageMarks, setDamageMarks] = useState<DamageMark[]>([]);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [markDescription, setMarkDescription] = useState("");
  const signatureRef = useRef<SignatureCanvas>(null);
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

  const handleClearSignature = () => {
    signatureRef.current?.clear();
  };

  const handleSubmit = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      alert("Please provide a signature before submitting");
      return;
    }

    const signatureData = signatureRef.current.toDataURL();
    onComplete(damageMarks, signatureData);
  };

  return (
    <div className="space-y-6">
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
            {/* Simple Car SVG Diagram */}
            <svg
              viewBox="0 0 800 600"
              className="w-full h-full pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Car Body - Top View */}
              <g>
                {/* Main Body */}
                <rect x="250" y="150" width="300" height="300" rx="20" fill="#e0e0e0" stroke="#333" strokeWidth="3"/>
                
                {/* Windshield */}
                <rect x="270" y="170" width="260" height="80" rx="10" fill="#b3d9ff" stroke="#333" strokeWidth="2"/>
                
                {/* Hood */}
                <rect x="270" y="260" width="260" height="90" fill="#d0d0d0" stroke="#333" strokeWidth="2"/>
                
                {/* Trunk */}
                <rect x="270" y="360" width="260" height="70" fill="#d0d0d0" stroke="#333" strokeWidth="2"/>
                
                {/* Wheels */}
                <ellipse cx="280" cy="200" rx="30" ry="40" fill="#333"/>
                <ellipse cx="520" cy="200" rx="30" ry="40" fill="#333"/>
                <ellipse cx="280" cy="400" rx="30" ry="40" fill="#333"/>
                <ellipse cx="520" cy="400" rx="30" ry="40" fill="#333"/>
                
                {/* Side Mirrors */}
                <rect x="220" y="280" width="25" height="40" rx="5" fill="#999" stroke="#333" strokeWidth="2"/>
                <rect x="555" y="280" width="25" height="40" rx="5" fill="#999" stroke="#333" strokeWidth="2"/>
                
                {/* Labels */}
                <text x="400" y="220" textAnchor="middle" fill="#333" fontSize="16" fontWeight="bold">FRONT</text>
                <text x="400" y="310" textAnchor="middle" fill="#333" fontSize="14">HOOD</text>
                <text x="400" y="395" textAnchor="middle" fill="#333" fontSize="14">TRUNK</text>
                <text x="400" y="460" textAnchor="middle" fill="#333" fontSize="16" fontWeight="bold">REAR</text>
                
                <text x="180" y="320" textAnchor="middle" fill="#333" fontSize="12" transform="rotate(-90 180 320)">LEFT SIDE</text>
                <text x="620" y="320" textAnchor="middle" fill="#333" fontSize="12" transform="rotate(90 620 320)">RIGHT SIDE</text>
              </g>
            </svg>

            {/* Damage Marks */}
            {damageMarks.map((mark) => (
              <div
                key={mark.id}
                className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                  selectedMark === mark.id
                    ? "bg-red-500 border-red-700 scale-125"
                    : "bg-red-400 border-red-600 hover:scale-110"
                }`}
                style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedMark(mark.id);
                  setMarkDescription(mark.description);
                }}
              >
                <X className="h-4 w-4 text-white" />
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

      {/* Signature Pad */}
      <Card>
        <CardHeader>
          <CardTitle>Client Signature</CardTitle>
          <p className="text-sm text-gray-600">Please sign below to confirm the vehicle condition</p>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-gray-300 rounded-lg bg-white">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: "w-full h-40",
              }}
              backgroundColor="white"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" variant="outline" onClick={handleClearSignature}>
              Clear Signature
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmit} className="bg-orange-500 hover:bg-orange-600">
          Complete Contract
        </Button>
      </div>
    </div>
  );
}
