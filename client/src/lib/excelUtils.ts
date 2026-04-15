export interface JsonSheetDef {
  name: string;
  type: "json";
  data: Record<string, unknown>[];
  columnWidths?: number[];
}

export interface AoaSheetDef {
  name: string;
  type: "aoa";
  data: unknown[][];
  columnWidths?: number[];
}

export type SheetDef = JsonSheetDef | AoaSheetDef;

export async function generateExcelBuffer(sheets: SheetDef[]): Promise<Uint8Array> {
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);

    if (sheet.type === "json") {
      if (sheet.data.length > 0) {
        const headers = Object.keys(sheet.data[0]);
        ws.addRow(headers);
        for (const row of sheet.data) {
          ws.addRow(headers.map((h) => row[h]));
        }
      }
    } else {
      for (const row of sheet.data) {
        ws.addRow(row as ExcelJS.CellValue[]);
      }
    }

    if (sheet.columnWidths) {
      ws.columns = sheet.columnWidths.map((w) => ({ width: w }));
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Uint8Array;
}

export function downloadExcel(buffer: Uint8Array, filename: string): void {
  const blob = new Blob([buffer as unknown as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
