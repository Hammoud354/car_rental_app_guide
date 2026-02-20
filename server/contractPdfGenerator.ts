import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

type FieldMapping = {
  x: number; // Percentage (0-100)
  y: number; // Percentage (0-100)
  fontSize: number;
  alignment: 'left' | 'center' | 'right';
};

type ContractData = {
  clientName?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientLicenseNumber?: string;
  clientNationality?: string;
  clientDateOfBirth?: string;
  clientPlaceOfBirth?: string;
  clientPassportNumber?: string;
  clientRegistrationNumber?: string;
  clientLicenseIssueDate?: string;
  clientLicenseExpiryDate?: string;
  vehiclePlate?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  startDate?: string;
  endDate?: string;
  pickupLocation?: string;
  returnLocation?: string;
  dailyRate?: string;
  totalAmount?: string;
  deposit?: string;
  contractNumber?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
};

export async function generateContractPDF(
  templateUrl: string,
  fieldMap: Record<string, FieldMapping>,
  contractData: ContractData
): Promise<Uint8Array> {
  try {
    // Download template image
    const imageResponse = await globalThis.fetch(templateUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    
    // Embed the template image
    let templateImage;
    const contentType = imageResponse.headers.get('content-type');
    
    if (contentType?.includes('png')) {
      templateImage = await pdfDoc.embedPng(imageBuffer);
    } else if (contentType?.includes('jpg') || contentType?.includes('jpeg')) {
      templateImage = await pdfDoc.embedJpg(imageBuffer);
    } else {
      throw new Error('Unsupported image format. Please use PNG or JPG.');
    }
    
    // Get image dimensions
    const imageDims = templateImage.scale(1);
    
    // Create a page with the same dimensions as the template
    const page = pdfDoc.addPage([imageDims.width, imageDims.height]);
    
    // Draw the template image as background
    page.drawImage(templateImage, {
      x: 0,
      y: 0,
      width: imageDims.width,
      height: imageDims.height,
    });
    
    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Draw text fields at configured positions
    for (const [fieldId, mapping] of Object.entries(fieldMap)) {
      const text = contractData[fieldId as keyof ContractData] || '';
      if (!text) continue;
      
      // Convert percentage coordinates to absolute positions
      // Note: PDF coordinates start from bottom-left, so we need to invert Y
      const x = (mapping.x / 100) * imageDims.width;
      const y = imageDims.height - ((mapping.y / 100) * imageDims.height);
      
      // Calculate text width for alignment
      const textWidth = font.widthOfTextAtSize(text, mapping.fontSize);
      
      let finalX = x;
      if (mapping.alignment === 'center') {
        finalX = x - (textWidth / 2);
      } else if (mapping.alignment === 'right') {
        finalX = x - textWidth;
      }
      
      // Draw text
      page.drawText(text, {
        x: finalX,
        y: y,
        size: mapping.fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
    
    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
    
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to format contract data for PDF generation
 */
export function formatContractDataForPDF(contract: any, client: any, vehicle: any, company: any): ContractData {
  // Helper function to safely convert values to numbers
  const toNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  };

  // Helper function to format dates
  const formatDate = (date: any): string => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return '';
    }
  };

  return {
    clientName: client && client.firstName && client.lastName ? `${client.firstName} ${client.lastName}` : '',
    clientAddress: client?.address ? client.address : '',
    clientPhone: client?.phone ? client.phone : '',
    clientEmail: client?.email ? client.email : '',
    clientLicenseNumber: client?.drivingLicenseNumber ? client.drivingLicenseNumber : '',
    clientNationality: client?.nationality ? client.nationality : '',
    clientDateOfBirth: client?.dateOfBirth ? formatDate(client.dateOfBirth) : '',
    clientPlaceOfBirth: client?.placeOfBirth ? client.placeOfBirth : '',
    clientPassportNumber: client?.passportIdNumber ? client.passportIdNumber : '',
    clientRegistrationNumber: client?.registrationNumber ? client.registrationNumber : '',
    clientLicenseIssueDate: client?.licenseIssueDate ? formatDate(client.licenseIssueDate) : '',
    clientLicenseExpiryDate: client?.licenseExpiryDate ? formatDate(client.licenseExpiryDate) : '',
    vehiclePlate: vehicle?.plateNumber ? vehicle.plateNumber : '',
    vehicleMake: vehicle?.make ? vehicle.make : '',
    vehicleModel: vehicle?.model ? vehicle.model : '',
    vehicleYear: vehicle?.year ? vehicle.year.toString() : '',
    startDate: contract?.startDate ? formatDate(contract.startDate) : '',
    endDate: contract?.endDate ? formatDate(contract.endDate) : '',
    pickupLocation: contract?.pickupLocation ? contract.pickupLocation : '',
    returnLocation: contract?.returnLocation ? contract.returnLocation : '',
    dailyRate: contract?.dailyRate ? `$${parseFloat(contract.dailyRate).toFixed(2)}` : '',
    totalAmount: contract?.totalAmount ? `$${parseFloat(contract.totalAmount).toFixed(2)}` : '',
    deposit: contract?.depositAmount ? `$${parseFloat(contract.depositAmount).toFixed(2)}` : '',
    contractNumber: contract?.contractNumber || (contract?.id ? contract.id.toString() : ''),
    companyName: company?.companyName || '',
    companyAddress: company?.address || '',
    companyPhone: company?.phone || '',
  };
}
