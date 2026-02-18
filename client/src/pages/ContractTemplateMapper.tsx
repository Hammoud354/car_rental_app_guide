import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Plus, Trash2 } from "lucide-react";

// Sample contract data for preview
const SAMPLE_DATA: Record<string, string> = {
  // Client Information
  clientName: "John Doe",
  clientAddress: "123 Main Street, Beirut",
  clientPhone: "+961 1 234567",
  clientEmail: "john.doe@example.com",
  clientNationality: "Lebanese",
  clientLicenseNumber: "DL123456",
  clientLicenseIssueDate: "2020-01-15",
  clientLicenseExpiryDate: "2030-01-15",
  clientDateOfBirth: "1990-05-20",
  clientPassportNumber: "P1234567",
  
  // Vehicle Information
  vehiclePlate: "ABC-1234",
  vehicleMake: "Toyota",
  vehicleModel: "Camry",
  vehicleYear: "2023",
  vehicleColor: "Silver",
  vehicleVIN: "1HGBH41JXMN109186",
  vehicleOdometer: "15,000 km",
  
  // Contract Details
  contractNumber: "CNT-2026-001",
  startDate: "2026-02-18",
  endDate: "2026-02-25",
  pickupLocation: "Beirut Airport",
  returnLocation: "Beirut Airport",
  pickupTime: "10:00 AM",
  returnTime: "10:00 AM",
  
  // Financial Information
  dailyRate: "$50.00",
  totalAmount: "$350.00",
  deposit: "$100.00",
  insuranceFee: "$25.00",
  additionalFees: "$10.00",
  paymentMethod: "Credit Card",
  
  // Company Information
  companyName: "Car Rental Co.",
  companyAddress: "456 Business St, Beirut",
  companyPhone: "+961 1 987654",
  companyEmail: "info@carrentalco.com",
  companyRegistration: "REG123456",
  companyTaxId: "TAX789012",
};

// Define available contract fields
const CONTRACT_FIELDS = [
  // Client Information
  { id: "clientName", label: "Client Name" },
  { id: "clientAddress", label: "Client Address" },
  { id: "clientPhone", label: "Client Phone" },
  { id: "clientEmail", label: "Client Email" },
  { id: "clientNationality", label: "Client Nationality" },
  { id: "clientLicenseNumber", label: "License Number" },
  { id: "clientLicenseIssueDate", label: "License Issue Date" },
  { id: "clientLicenseExpiryDate", label: "License Expiry Date" },
  { id: "clientDateOfBirth", label: "Client Date of Birth" },
  { id: "clientPassportNumber", label: "Passport Number" },
  
  // Vehicle Information
  { id: "vehiclePlate", label: "Vehicle Plate" },
  { id: "vehicleMake", label: "Vehicle Make" },
  { id: "vehicleModel", label: "Vehicle Model" },
  { id: "vehicleYear", label: "Vehicle Year" },
  { id: "vehicleColor", label: "Vehicle Color" },
  { id: "vehicleVIN", label: "Vehicle VIN" },
  { id: "vehicleOdometer", label: "Odometer Reading" },
  
  // Contract Details
  { id: "contractNumber", label: "Contract Number" },
  { id: "startDate", label: "Start Date" },
  { id: "endDate", label: "End Date" },
  { id: "pickupLocation", label: "Pickup Location" },
  { id: "returnLocation", label: "Return Location" },
  { id: "pickupTime", label: "Pickup Time" },
  { id: "returnTime", label: "Return Time" },
  
  // Financial Information
  { id: "dailyRate", label: "Daily Rate" },
  { id: "totalAmount", label: "Total Amount" },
  { id: "deposit", label: "Deposit" },
  { id: "insuranceFee", label: "Insurance Fee" },
  { id: "additionalFees", label: "Additional Fees" },
  { id: "paymentMethod", label: "Payment Method" },
  
  // Company Information
  { id: "companyName", label: "Company Name" },
  { id: "companyAddress", label: "Company Address" },
  { id: "companyPhone", label: "Company Phone" },
  { id: "companyEmail", label: "Company Email" },
  { id: "companyRegistration", label: "Company Registration" },
  { id: "companyTaxId", label: "Company Tax ID" },
];

type FieldPosition = {
  fieldId: string;
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  fontSize: number;
  alignment: "left" | "center" | "right";
};

export default function ContractTemplateMapper() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: profile, isLoading } = trpc.company.getProfile.useQuery();
  

  const updateProfile = trpc.company.updateProfile.useMutation();
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [fieldPositions, setFieldPositions] = useState<FieldPosition[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showGridlines, setShowGridlines] = useState(true);

  useEffect(() => {
    if (profile?.contractTemplateFieldMap) {
      // Load existing field mappings
      const mappings = profile.contractTemplateFieldMap as Record<string, any>;
      const positions: FieldPosition[] = Object.entries(mappings).map(([fieldId, config]) => ({
        fieldId,
        x: config.x || 0,
        y: config.y || 0,
        fontSize: config.fontSize || 12,
        alignment: config.alignment || "left",
      }));
      setFieldPositions(positions);
    }
  }, [profile]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!selectedField || !imageRef.current || !containerRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if field already exists
    const existingIndex = fieldPositions.findIndex(fp => fp.fieldId === selectedField);
    
    if (existingIndex >= 0) {
      // Update existing position
      const updated = [...fieldPositions];
      updated[existingIndex] = { ...updated[existingIndex], x, y };
      setFieldPositions(updated);
    } else {
      // Add new position
      setFieldPositions([...fieldPositions, {
        fieldId: selectedField,
        x,
        y,
        fontSize: 12,
        alignment: "left",
      }]);
    }

    toast({
      title: "Field Positioned",
      description: `${CONTRACT_FIELDS.find(f => f.id === selectedField)?.label} placed at (${x.toFixed(1)}%, ${y.toFixed(1)}%)`,
    });
  };

  const updateFieldProperty = (fieldId: string, property: keyof FieldPosition, value: any) => {
    setFieldPositions(prev =>
      prev.map(fp => fp.fieldId === fieldId ? { ...fp, [property]: value } : fp)
    );
  };

  const removeField = (fieldId: string) => {
    setFieldPositions(prev => prev.filter(fp => fp.fieldId !== fieldId));
  };

  const handleSave = async () => {
    try {
      // Convert field positions array to object mapping
      const fieldMap: Record<string, any> = {};
      fieldPositions.forEach(fp => {
        fieldMap[fp.fieldId] = {
          x: fp.x,
          y: fp.y,
          fontSize: fp.fontSize,
          alignment: fp.alignment,
        };
      });

      await updateProfile.mutateAsync({
        companyName: profile?.companyName || "",
        contractTemplateFieldMap: fieldMap,
      });

      toast({
        title: "Success",
        description: "Field mappings saved successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save field mappings. Please try again.",
        variant: "destructive",
      });
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
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Template Uploaded</CardTitle>
            <CardDescription>
              Please upload a contract template in Company Settings first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/company-settings')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Company Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contract Template Field Mapper</h1>
            <p className="text-muted-foreground mt-2">
              Click on the template image to position contract fields. Select a field from the list first.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setLocation('/company-settings')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              variant={showPreview ? "default" : "outline"}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </Button>
            <Button
              variant={showGridlines ? "default" : "outline"}
              onClick={() => setShowGridlines(!showGridlines)}
            >
              {showGridlines ? "Hide Gridlines" : "Show Gridlines"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Mappings
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Image */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Template Image</CardTitle>
              <CardDescription>
                Click on the image to place the selected field
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                ref={containerRef}
                className="relative border-2 border-border rounded-lg overflow-hidden bg-muted"
                style={{ cursor: selectedField ? 'crosshair' : 'default' }}
              >
                <img
                  ref={imageRef}
                  src={profile.contractTemplateUrl}
                  alt="Contract Template"
                  className="w-full h-auto"
                  onClick={handleImageClick}
                  onLoad={() => setImageLoaded(true)}
                />
                
                {/* Gridlines overlay */}
                {imageLoaded && showGridlines && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Vertical gridlines */}
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={`v-${i}`}
                        className="absolute top-0 bottom-0 border-l border-blue-400/30"
                        style={{ left: `${(i + 1) * 5}%` }}
                      />
                    ))}
                    {/* Horizontal gridlines */}
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={`h-${i}`}
                        className="absolute left-0 right-0 border-t border-blue-400/30"
                        style={{ top: `${(i + 1) * 5}%` }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Show positioned fields as markers or preview text */}
                {imageLoaded && fieldPositions.map(fp => (
                  <div
                    key={fp.fieldId}
                    className="absolute"
                    style={{
                      left: `${fp.x}%`,
                      top: `${fp.y}%`,
                      transform: showPreview ? 'translate(0, -50%)' : 'translate(-50%, -50%)',
                      textAlign: fp.alignment,
                    }}
                    title={CONTRACT_FIELDS.find(f => f.id === fp.fieldId)?.label}
                  >
                    {showPreview ? (
                      <div
                        style={{
                          fontSize: `${fp.fontSize}px`,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {SAMPLE_DATA[fp.fieldId] || fp.fieldId}
                      </div>
                    ) : (
                      <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Field Selection and Configuration */}
        <div className="space-y-6">
          {/* Available Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Available Fields</CardTitle>
              <CardDescription>
                Select a field to position on the template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {CONTRACT_FIELDS.map(field => {
                const isPositioned = fieldPositions.some(fp => fp.fieldId === field.id);
                const isSelected = selectedField === field.id;
                
                return (
                  <Button
                    key={field.id}
                    variant={isSelected ? "default" : isPositioned ? "secondary" : "outline"}
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setSelectedField(field.id)}
                  >
                    {isPositioned && <span className="mr-2">✓</span>}
                    {field.label}
                  </Button>
                );
              })}
            </CardContent>
          </Card>

          {/* Positioned Fields Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Positioned Fields ({fieldPositions.length})</CardTitle>
              <CardDescription>
                Configure field properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fieldPositions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No fields positioned yet
                </p>
              ) : (
                fieldPositions.map(fp => {
                  const field = CONTRACT_FIELDS.find(f => f.id === fp.fieldId);
                  return (
                    <div key={fp.fieldId} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{field?.label}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeField(fp.fieldId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <Label className="text-xs">Font Size</Label>
                          <Input
                            type="number"
                            value={fp.fontSize}
                            onChange={(e) => updateFieldProperty(fp.fieldId, 'fontSize', parseInt(e.target.value))}
                            min={8}
                            max={72}
                            className="h-7"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Alignment</Label>
                          <Select
                            value={fp.alignment}
                            onValueChange={(value) => updateFieldProperty(fp.fieldId, 'alignment', value)}
                          >
                            <SelectTrigger className="h-7">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Position: {fp.x.toFixed(1)}%, {fp.y.toFixed(1)}%
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
