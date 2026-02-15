import React from 'react';

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
}

interface Contract {
  contractNumber: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  drivingLicenseNumber: string;
  licenseExpiryDate: string;
  rentalStartDate: string;
  rentalEndDate: string;
  rentalDays: number;
  dailyRate: string;
  totalAmount: string;
  discount?: string;
  finalAmount: string;
  status: string;
  returnedAt?: string;
  pickupKm?: number;
  returnKm?: number;
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
}

export const ContractPDFTemplate: React.FC<ContractPDFTemplateProps> = ({ contract, vehicle, companyProfile }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

      {/* Client Information */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '12px', color: '#1e40af', borderBottom: '2px solid #e5e7eb', paddingBottom: '5px' }}>
          CLIENT INFORMATION
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', width: '40%', fontWeight: 'bold' }}>Full Name:</td>
              <td style={{ padding: '8px 0' }}>{contract.clientName}</td>
            </tr>
            {contract.clientEmail && (
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Email:</td>
                <td style={{ padding: '8px 0' }}>{contract.clientEmail}</td>
              </tr>
            )}
            {contract.clientPhone && (
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Phone:</td>
                <td style={{ padding: '8px 0' }}>{contract.clientPhone}</td>
              </tr>
            )}
            {contract.clientAddress && (
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Address:</td>
                <td style={{ padding: '8px 0' }}>{contract.clientAddress}</td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>License Number:</td>
              <td style={{ padding: '8px 0', fontFamily: 'monospace' }}>{contract.drivingLicenseNumber}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>License Expiry:</td>
              <td style={{ padding: '8px 0' }}>{formatDate(contract.licenseExpiryDate)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Vehicle Information */}
      <div style={{ marginBottom: '25px' }}>
        <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '12px', color: '#1e40af', borderBottom: '2px solid #e5e7eb', paddingBottom: '5px' }}>
          VEHICLE INFORMATION
        </h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', width: '40%', fontWeight: 'bold' }}>Plate Number:</td>
              <td style={{ padding: '8px 0', fontWeight: 'bold', fontSize: '12pt' }}>{vehicle?.plateNumber || 'Not Specified'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Vehicle:</td>
              <td style={{ padding: '8px 0' }}>
                {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})` : 'Not Specified'}
              </td>
            </tr>
            {vehicle?.category && (
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Category:</td>
                <td style={{ padding: '8px 0' }}>{vehicle.category}</td>
              </tr>
            )}
            {vehicle?.color && (
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Color:</td>
                <td style={{ padding: '8px 0' }}>{vehicle.color}</td>
              </tr>
            )}
            {vehicle?.vin && (
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold' }}>VIN Number:</td>
                <td style={{ padding: '8px 0', fontFamily: 'monospace' }}>{vehicle.vin}</td>
              </tr>
            )}
          </tbody>
        </table>
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
