import React from 'react';

interface PDFDamageMark {
  id: number;
  view?: string | null;
  xPosition: string;
  yPosition: string;
  description?: string | null;
}

type CarView = "left" | "right" | "front" | "rear";

const VIEW_LABELS: Record<CarView, string> = {
  left: "LEFT SIDE",
  right: "RIGHT SIDE",
  front: "FRONT",
  rear: "REAR",
};

// Matches the cropping from CarDamageInspection.tsx
const VIEW_STYLE: Record<CarView, { bgSize: string; bgPos: string }> = {
  left:  { bgSize: "100% 300%", bgPos: "50% 0%"   },
  right: { bgSize: "100% 300%", bgPos: "50% 50%"  },
  front: { bgSize: "200% 300%", bgPos: "0% 100%"  },
  rear:  { bgSize: "200% 300%", bgPos: "100% 100%" },
};

interface CompanyProfile {
  companyName: string;
  logoUrl?: string | null;
  registrationNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

interface Vehicle {
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  category?: string | null;
  color?: string | null;
  vin?: string | null;
  fuelType?: string | null;
}

interface Contract {
  contractNumber: string;
  clientName: string;
  clientMotherFullName?: string | null;
  clientNationality?: string | null;
  clientRegistrationNumber?: string | null;
  clientPassport?: string | null;
  clientDateOfBirth?: string | Date | null;
  clientPlaceOfBirth?: string | null;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  drivingLicenseNumber: string;
  licenseIssueDate?: string | Date | null;
  licenseExpiryDate: string | Date;
  rentalStartDate: string;
  rentalEndDate: string;
  rentalDays: number;
  pickupTime?: string;
  returnTime?: string;
  dailyRate: string;
  totalAmount: string;
  discount?: string;
  finalAmount: string;
  status: string;
  returnedAt?: string;
  pickupKm?: number;
  returnKm?: number;
  vehicleType?: string;
  vehicleColor?: string;
  vehicleFuelType?: string;
  vehicleVIN?: string;
  fuelLevel?: string;
  returnFuelLevel?: string;
  kmLimit?: number;
  overLimitKmFee?: string;
  lateFee?: string;
  damageInspection?: string;
  returnNotes?: string;
  signatureData?: string;
}

interface ContractPDFTemplateProps {
  contract: Contract;
  vehicle: Vehicle | null;
  companyProfile?: CompanyProfile | null;
  damageMarks?: PDFDamageMark[];
}

export const ContractPDFTemplate: React.FC<ContractPDFTemplateProps> = ({ contract, vehicle, companyProfile, damageMarks = [] }) => {
  // Build absolute image URL so html2canvas can fetch it
  const carSchemaUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/car-schema.jpeg`
    : '/car-schema.jpeg';

  const renderCarPanel = (view: CarView, panelWidth: string, marks: PDFDamageMark[]) => {
    const { bgSize, bgPos } = VIEW_STYLE[view];
    const viewMarks = marks.filter(m => m.view === view);
    // padding-top % is always relative to the PARENT's width (CSS rule).
    // Left/Right: full-width (100%), 3:1 → height = 33.33% of parent ✓
    // Front/Rear: half-width (50%), 3:2 → height = (2/3)*(50%) = 33.33% of parent ✓
    // All 4 views end up the same height — 33.33% of the content column width.
    return (
      <div style={{ width: panelWidth, display: 'inline-block', verticalAlign: 'top', paddingRight: panelWidth === '50%' ? '4px' : '0', boxSizing: 'border-box' }}>
        <div style={{ fontSize: '7pt', fontWeight: 'bold', color: '#6b7280', textAlign: 'center', marginBottom: '3px', letterSpacing: '1px' }}>
          {VIEW_LABELS[view]}
        </div>
        {/* Outer div provides the aspect-ratio height via padding-top (% of parent width) */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '33.33%' }}>
          {/* Inner div fills the outer space and holds the background + marks */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${carSchemaUrl})`,
            backgroundSize: bgSize,
            backgroundPosition: bgPos,
            backgroundRepeat: 'no-repeat',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            {viewMarks.map(mark => {
              const globalIdx = marks.findIndex(m => m.id === mark.id) + 1;
              return (
                <div key={mark.id} style={{
                  position: 'absolute',
                  left: `${mark.xPosition}%`,
                  top: `${mark.yPosition}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8pt',
                  fontWeight: 'bold',
                  color: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  zIndex: 1,
                }}>
                  {globalIdx}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return '—';
    try {
      return new Date(dateValue).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return String(dateValue);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div 
      id="contract-pdf-template" 
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '210mm', // A4 width
        minHeight: '297mm', // A4 height
        padding: '20mm',
        backgroundColor: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11pt',
        lineHeight: '1.6',
        color: '#000000'
      }}
    >
      {/* Company Branding Header */}
      {companyProfile && (
        <div style={{ marginBottom: '25px', borderBottom: '2px solid #e5e7eb', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {companyProfile.logoUrl && (
                <img 
                  src={companyProfile.logoUrl} 
                  alt={companyProfile.companyName}
                  style={{ height: '60px', width: '60px', objectFit: 'contain' }}
                />
              )}
              <div>
                <div style={{ fontSize: '18pt', fontWeight: 'bold', color: '#1e40af', marginBottom: '5px' }}>
                  {companyProfile.companyName}
                </div>
                {companyProfile.registrationNumber && (
                  <div style={{ fontSize: '9pt', color: '#6b7280' }}>
                    Reg. No: {companyProfile.registrationNumber}
                  </div>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '9pt', color: '#4b5563', lineHeight: '1.4' }}>
              {companyProfile.phone && <div>{companyProfile.phone}</div>}
              {companyProfile.email && <div>{companyProfile.email}</div>}
              {companyProfile.address && <div>{companyProfile.address}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #2563EB', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: '0 0 10px 0', color: '#1e40af' }}>
          CAR RENTAL CONTRACT
        </h1>
        <div style={{ fontSize: '12pt', color: '#4b5563' }}>
          Contract Number: <strong>{contract.contractNumber}</strong>
        </div>
        <div style={{ fontSize: '10pt', color: '#6b7280', marginTop: '5px' }}>
          Date Issued: {formatDate(contract.rentalStartDate)}
        </div>
      </div>

      {/* Client Info (left) + Vehicle Info (right) side by side */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '25px', alignItems: 'flex-start' }}>

        {/* ── LEFT: Client Information ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '6px', color: '#1e40af', borderBottom: '2px solid #2563eb', paddingBottom: '4px' }}>
            CLIENT INFORMATION
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <tbody>
              {[
                ['Full Name',       contract.clientName,                              null],
                ["Mother's Name",   contract.clientMotherFullName || '—',             null],
                ['Nationality',     contract.clientNationality || '—',                null],
                ['Registration No.',contract.clientRegistrationNumber || '—',         'monospace'],
                ['Passport No.',    contract.clientPassport || '—',                   'monospace'],
                ['Date of Birth',   formatDate(contract.clientDateOfBirth as any),   null],
                ['Place of Birth',  contract.clientPlaceOfBirth || '—',              null],
                ['Phone',           contract.clientPhone || '—',                      null],
                ['License No.',     contract.drivingLicenseNumber,                   'monospace'],
                ['Issue Date',      formatDate(contract.licenseIssueDate as any),    null],
                ['Expiry Date',     formatDate(contract.licenseExpiryDate as any),   null],
                ['Address',         contract.clientAddress || '—',                   null],
              ].map(([label, value, font]) => (
                <tr key={String(label)} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '4px 6px', width: '42%', fontWeight: 'bold', color: '#374151', backgroundColor: '#f9fafb', whiteSpace: 'nowrap' }}>{label}:</td>
                  <td style={{ padding: '4px 6px', fontFamily: font === 'monospace' ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{value as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── RIGHT: Vehicle Information ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '6px', color: '#1e40af', borderBottom: '2px solid #2563eb', paddingBottom: '4px' }}>
            VEHICLE INFORMATION
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <tbody>
              {[
                ['Make & Model', vehicle ? `${vehicle.brand} ${vehicle.model}` : '—', null],
                ['Model Year',   String(vehicle?.year || '—'),                         null],
                ['Plate Number', vehicle?.plateNumber || '—',                          'monospace'],
                ['VIN',          vehicle?.vin || '—',                                  'monospace'],
                ['Type',         vehicle?.category || contract.vehicleType || '—',     null],
                ['Color',        vehicle?.color || contract.vehicleColor || '—',       null],
                ['Fuel Type',    vehicle?.fuelType || contract.vehicleFuelType || '—', null],
                ['Fuel Level',   contract.fuelLevel || '—',                            null],
              ].map(([label, value, font]) => (
                <tr key={String(label)} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '4px 6px', width: '42%', fontWeight: 'bold', color: '#374151', backgroundColor: '#f9fafb', whiteSpace: 'nowrap' }}>{label}:</td>
                  <td style={{ padding: '4px 6px', fontFamily: font === 'monospace' ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{value as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Rental Period & Pricing */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '12px', color: '#1e40af', borderBottom: '2px solid #e5e7eb', paddingBottom: '5px' }}>
          RENTAL PERIOD & PRICING
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', width: '40%', fontWeight: 'bold' }}>Start Date:</td>
              <td style={{ padding: '8px 0' }}>{formatDate(contract.rentalStartDate)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Return Date:</td>
              <td style={{ padding: '8px 0' }}>{formatDate(contract.rentalEndDate)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Rental Days:</td>
              <td style={{ padding: '8px 0' }}>{contract.rentalDays} days</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Daily Rate:</td>
              <td style={{ padding: '8px 0' }}>{formatCurrency(contract.dailyRate)}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Total Amount:</td>
              <td style={{ padding: '8px 0' }}>{formatCurrency(contract.totalAmount)}</td>
            </tr>
            {contract.discount && parseFloat(contract.discount) > 0 && (
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Discount:</td>
                <td style={{ padding: '8px 0', color: '#059669' }}>-{formatCurrency(contract.discount)}</td>
              </tr>
            )}
            <tr style={{ borderTop: '2px solid #e5e7eb' }}>
              <td style={{ padding: '12px 0', fontWeight: 'bold', fontSize: '13pt' }}>Final Amount:</td>
              <td style={{ padding: '12px 0', fontWeight: 'bold', fontSize: '15pt', color: '#1e40af' }}>
                {formatCurrency(contract.finalAmount)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Return Information - only for completed contracts */}
      {contract.status === 'completed' && contract.returnedAt && (
        <div style={{ marginBottom: '25px', backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '2px solid #86efac' }}>
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '12px', color: '#166534' }}>
            RETURN INFORMATION
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', width: '40%', fontWeight: 'bold' }}>Returned On:</td>
                <td style={{ padding: '8px 0' }}>
                  {formatDate(contract.returnedAt)} at {new Date(contract.returnedAt).toLocaleTimeString()}
                </td>
              </tr>
              {contract.pickupKm && contract.returnKm && (
                <>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Pickup Odometer:</td>
                    <td style={{ padding: '8px 0' }}>{contract.pickupKm.toLocaleString()} km</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Return Odometer:</td>
                    <td style={{ padding: '8px 0' }}>{contract.returnKm.toLocaleString()} km</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Total Distance:</td>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#166534' }}>
                      {(contract.returnKm - contract.pickupKm).toLocaleString()} km
                    </td>
                  </tr>
                </>
              )}
              {contract.fuelLevel && contract.returnFuelLevel && (
                <>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Pickup Fuel Level:</td>
                    <td style={{ padding: '8px 0' }}>{contract.fuelLevel}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Return Fuel Level:</td>
                    <td style={{ padding: '8px 0' }}>{contract.returnFuelLevel}</td>
                  </tr>
                </>
              )}
              {contract.kmLimit && contract.pickupKm && contract.returnKm && (
                <>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>KM Limit:</td>
                    <td style={{ padding: '8px 0' }}>{contract.kmLimit.toLocaleString()} km</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', fontWeight: 'bold' }}>KM Driven:</td>
                    <td style={{ padding: '8px 0', color: (contract.returnKm - contract.pickupKm) > contract.kmLimit ? '#dc2626' : '#166534' }}>
                      {(contract.returnKm - contract.pickupKm).toLocaleString()} km
                      {(contract.returnKm - contract.pickupKm) > contract.kmLimit && (
                        <span style={{ fontSize: '9pt', marginLeft: '5px' }}>
                          (+{((contract.returnKm - contract.pickupKm) - contract.kmLimit).toLocaleString()} km over)
                        </span>
                      )}
                    </td>
                  </tr>
                </>
              )}
              {contract.overLimitKmFee && parseFloat(contract.overLimitKmFee) > 0 && (
                <tr style={{ backgroundColor: '#fee2e2', borderTop: '2px solid #fca5a5' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#991b1b' }}>⚠️ Over-Limit KM Fee:</td>
                  <td style={{ padding: '12px 8px', fontWeight: 'bold', fontSize: '13pt', color: '#991b1b' }}>
                    {formatCurrency(contract.overLimitKmFee)}
                  </td>
                </tr>
              )}
              {contract.damageInspection && (
                <tr>
                  <td colSpan={2} style={{ padding: '12px 0' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔍 Damage Inspection:</div>
                    <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db', whiteSpace: 'pre-wrap' }}>
                      {contract.damageInspection}
                    </div>
                  </td>
                </tr>
              )}
              {contract.returnNotes && (
                <tr>
                  <td colSpan={2} style={{ padding: '12px 0' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Additional Notes:</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{contract.returnNotes}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Overdue Information */}
      {contract.status === "overdue" && (
        <div style={{ marginBottom: '25px', backgroundColor: '#fef2f2', padding: '15px', borderRadius: '8px', border: '2px solid #fca5a5' }}>
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '12px', color: '#991b1b' }}>
            ⚠️ OVERDUE INFORMATION
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', width: '40%', fontWeight: 'bold' }}>Days Overdue:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold', fontSize: '13pt', color: '#dc2626' }}>
                  {Math.floor((new Date().getTime() - new Date(contract.rentalEndDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Late Fee (100% of daily rate):</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold', fontSize: '13pt', color: '#dc2626' }}>
                  {formatCurrency(contract.lateFee || "0")}
                </td>
              </tr>
              <tr style={{ borderTop: '2px solid #fca5a5' }}>
                <td style={{ padding: '12px 0', fontWeight: 'bold', fontSize: '13pt' }}>Total Amount Due:</td>
                <td style={{ padding: '12px 0', fontWeight: 'bold', fontSize: '15pt', color: '#991b1b' }}>
                  {formatCurrency((parseFloat(contract.finalAmount) + parseFloat(contract.lateFee || "0")).toFixed(2))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Vehicle Inspection Diagram */}
      <div style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '10px', color: '#1e40af', borderBottom: '2px solid #e5e7eb', paddingBottom: '5px' }}>
          VEHICLE INSPECTION REPORT
        </h2>
        <div style={{ fontSize: '9pt', color: '#6b7280', marginBottom: '10px' }}>
          Pre-rental condition documented at time of pickup. Numbered circles indicate existing damage locations.
        </div>

        {/* Left Side — full width */}
        {renderCarPanel('left', '100%', damageMarks)}
        <div style={{ height: '8px' }} />

        {/* Right Side — full width */}
        {renderCarPanel('right', '100%', damageMarks)}
        <div style={{ height: '8px' }} />

        {/* Front + Rear — side by side */}
        <div style={{ fontSize: '0' }}>
          {renderCarPanel('front', '50%', damageMarks)}
          {renderCarPanel('rear', '50%', damageMarks)}
        </div>

        {/* Legend */}
        {damageMarks.length > 0 ? (
          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px' }}>
            <div style={{ fontSize: '9pt', fontWeight: 'bold', marginBottom: '6px', color: '#991b1b' }}>
              Damage Notes ({damageMarks.length} mark{damageMarks.length !== 1 ? 's' : ''}):
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
              <tbody>
                {damageMarks.map((mark, idx) => (
                  <tr key={mark.id} style={{ borderTop: idx > 0 ? '1px solid #fecaca' : 'none' }}>
                    <td style={{ padding: '3px 8px 3px 0', width: '28px', verticalAlign: 'top' }}>
                      <div style={{
                        display: 'inline-block', width: '18px', height: '18px', borderRadius: '50%',
                        backgroundColor: '#dc2626', color: 'white', fontSize: '8pt', fontWeight: 'bold',
                        textAlign: 'center', lineHeight: '18px',
                      }}>
                        {idx + 1}
                      </div>
                    </td>
                    <td style={{ padding: '3px 4px', verticalAlign: 'top', width: '60px', color: '#6b7280', textTransform: 'uppercase', fontSize: '8pt' }}>
                      {mark.view || '—'}
                    </td>
                    <td style={{ padding: '3px 0', verticalAlign: 'top' }}>
                      {mark.description || '(no description)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', fontSize: '9pt', color: '#166534', textAlign: 'center' }}>
            ✓ No damage marks recorded — vehicle was in clean condition at pickup.
          </div>
        )}

        {/* Client acknowledgement */}
        <div style={{ marginTop: '15px', display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, borderTop: '1px solid #000', paddingTop: '4px', fontSize: '8pt', color: '#4b5563', textAlign: 'center' }}>
            Client Signature
          </div>
          <div style={{ flex: 1, borderTop: '1px solid #000', paddingTop: '4px', fontSize: '8pt', color: '#4b5563', textAlign: 'center' }}>
            Date
          </div>
          <div style={{ flex: 1, borderTop: '1px solid #000', paddingTop: '4px', fontSize: '8pt', color: '#4b5563', textAlign: 'center' }}>
            Agent Signature
          </div>
        </div>
      </div>

      {/* Signature */}
      {contract.signatureData && (
        <div style={{ marginTop: '40px', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '12px', color: '#1e40af', borderBottom: '2px solid #e5e7eb', paddingBottom: '5px' }}>
            CLIENT SIGNATURE
          </h2>
          <div style={{ border: '2px solid #d1d5db', borderRadius: '8px', padding: '15px', backgroundColor: '#f9fafb' }}>
            <img 
              src={contract.signatureData} 
              alt="Client Signature" 
              style={{ maxWidth: '100%', height: '120px', display: 'block', border: '1px solid #9ca3af', borderRadius: '4px', backgroundColor: '#ffffff' }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #e5e7eb', textAlign: 'center', fontSize: '9pt', color: '#6b7280' }}>
        <p style={{ margin: '5px 0' }}>This is a legally binding contract. Please read all terms and conditions carefully.</p>
        <p style={{ margin: '5px 0' }}>For questions or concerns, please contact our customer service.</p>
        <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>Thank you for choosing our car rental service!</p>
      </div>
    </div>
  );
};
