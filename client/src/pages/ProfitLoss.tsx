import { useState } from "react";
import { trpc } from "@/lib/trpc";
import SidebarLayout from "@/components/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, DollarSign, TrendingUp, TrendingDown, Download, Calendar } from "lucide-react";
import { Link } from "wouter";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ProfitLoss() {
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: "",
    endDate: "",
  });

  // Fetch financial overview
  const { data: financialData, isLoading: isLoadingFinancial } = trpc.profitLoss.getFinancialOverview.useQuery({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
  });

  // Fetch vehicle profitability
  const { data: vehicleProfitability, isLoading: isLoadingVehicles } = trpc.profitLoss.getVehicleProfitability.useQuery({
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
  });

  // Fetch monthly revenue data
  const currentYear = new Date().getFullYear();
  const { data: monthlyData, isLoading: isLoadingMonthly } = trpc.profitLoss.getRevenueByMonth.useQuery({
    year: currentYear,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const handleExportToExcel = () => {
    if (!financialData || !vehicleProfitability || !monthlyData) {
      alert("No data available to export");
      return;
    }

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Sheet 1: Financial Overview
    const overviewData = [
      ["Profit & Loss Statement"],
      ["Generated:", new Date().toLocaleDateString()],
      [""],
      ["REVENUE"],
      ["Contracts Revenue", financialData.revenue.contracts],
      ["Invoices Revenue", financialData.revenue.invoices],
      ["Total Revenue", financialData.revenue.total],
      [""],
      ["EXPENSES"],
      ["Maintenance Costs", financialData.expenses.maintenance],
      ["Insurance Costs", financialData.expenses.insurance],
      ["Total Expenses", financialData.expenses.total],
      [""],
      ["NET PROFIT/LOSS", financialData.profitLoss.netProfit],
      ["Profit Margin (%)", financialData.profitLoss.profitMargin],
      [""],
      ["ASSETS"],
      ["Fleet Purchase Costs", financialData.assets.vehiclePurchaseCosts],
      ["Total Vehicles", financialData.assets.totalVehicles],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, ws1, "Financial Overview");

    // Sheet 2: Vehicle Profitability
    const vehicleHeaders = [["Plate Number", "Brand", "Model", "Year", "Revenue", "Maintenance", "Insurance", "Total Expenses", "Net Profit", "ROI (%)", "Contracts"]];
    const vehicleRows = vehicleProfitability.map(v => [
      v.plateNumber,
      v.brand,
      v.model,
      v.year,
      v.revenue,
      v.expenses.maintenance,
      v.expenses.insurance,
      v.expenses.total,
      v.netProfit,
      v.roi,
      v.contractCount,
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([...vehicleHeaders, ...vehicleRows]);
    XLSX.utils.book_append_sheet(wb, ws2, "Vehicle Profitability");

    // Sheet 3: Monthly Data
    const monthlyHeaders = [["Month", "Revenue", "Expenses", "Net"]];
    const monthlyRows = monthlyData.map(m => [
      m.monthName,
      m.revenue,
      m.expenses,
      m.revenue - m.expenses,
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([...monthlyHeaders, ...monthlyRows]);
    XLSX.utils.book_append_sheet(wb, ws3, "Monthly Performance");

    // Save file
    const dateStr = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `ProfitLoss_Report_${dateStr}.xlsx`);
  };

  const handleExportToPDF = async () => {
    if (!financialData) {
      alert("No data available to export");
      return;
    }

    try {
      const element = document.getElementById("profit-loss-content");
      if (!element) {
        alert("Content not found for PDF export");
        return;
      }

      // Create a clone to avoid OKLCH color issues
      const clone = element.cloneNode(true) as HTMLElement;
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      document.body.appendChild(clone);

      // Convert OKLCH colors to RGB
      const allElements = clone.querySelectorAll("*");
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlEl);
        
        // Apply computed colors
        if (computedStyle.color) htmlEl.style.color = computedStyle.color;
        if (computedStyle.backgroundColor) htmlEl.style.backgroundColor = computedStyle.backgroundColor;
        if (computedStyle.borderColor) htmlEl.style.borderColor = computedStyle.borderColor;
      });

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      const dateStr = new Date().toISOString().split("T")[0];
      pdf.save(`ProfitLoss_Report_${dateStr}.pdf`);
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  const handleQuickFilter = (period: "month" | "quarter" | "year") => {
    const today = new Date();
    let startDate = new Date();

    switch (period) {
      case "month":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(today.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    setDateRange({
      startDate: startDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    });
  };

  const handleClearFilters = () => {
    setDateRange({ startDate: "", endDate: "" });
  };

  if (isLoadingFinancial || isLoadingVehicles || isLoadingMonthly) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </SidebarLayout>
    );
  }

  const isProfit = (financialData?.profitLoss.netProfit || 0) >= 0;

  return (
    <SidebarLayout>
      <div className="container mx-auto py-8 max-w-7xl">
      <div id="profit-loss-content">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <DollarSign className="h-8 w-8" />
          Profit & Loss Statement
        </h1>
        <p className="text-gray-600 mt-2">
          Comprehensive financial overview of your car rental business
        </p>
      </div>

      {/* Date Range Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Filter
          </CardTitle>
          <CardDescription>
            Filter financial data by date range or use quick filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="input-client"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="input-client"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={() => handleQuickFilter("month")} variant="outline" size="sm">
                Last Month
              </Button>
              <Button onClick={() => handleQuickFilter("quarter")} variant="outline" size="sm">
                Last Quarter
              </Button>
              <Button onClick={() => handleQuickFilter("year")} variant="outline" size="sm">
                Last Year
              </Button>
            </div>
            <div className="flex items-end">
              <Button onClick={handleClearFilters} variant="ghost" size="sm" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData?.revenue.total || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Contracts: {formatCurrency(financialData?.revenue.contracts || 0)} | 
              Invoices: {formatCurrency(financialData?.revenue.invoices || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData?.expenses.total || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Maintenance: {formatCurrency(financialData?.expenses.maintenance || 0)} | 
              Insurance: {formatCurrency(financialData?.expenses.insurance || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Net Profit/Loss */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Net {isProfit ? "Profit" : "Loss"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${isProfit ? "text-green-600" : "text-red-600"}`}>
              {isProfit ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {formatCurrency(Math.abs(financialData?.profitLoss.netProfit || 0))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Profit Margin: {formatPercent(financialData?.profitLoss.profitMargin || 0)}
            </p>
          </CardContent>
        </Card>

        {/* Fleet Assets */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Fleet Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialData?.assets.vehiclePurchaseCosts || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {financialData?.assets.totalVehicles || 0} vehicles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart (Simple Table View) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Revenue & Expenses ({currentYear})</CardTitle>
          <CardDescription>
            Track your monthly financial performance throughout the year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData?.map((month) => {
                  const net = month.revenue - month.expenses;
                  return (
                    <TableRow key={month.month}>
                      <TableCell className="font-medium">{month.monthName}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(month.revenue)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(month.expenses)}</TableCell>
                      <TableCell className={`text-right font-medium ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(net)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Profitability Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Vehicle Profitability Breakdown</CardTitle>
          <CardDescription>
            Analyze profit and loss for each vehicle in your fleet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net Profit</TableHead>
                  <TableHead className="text-right">ROI</TableHead>
                  <TableHead className="text-right">Contracts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleProfitability?.map((vehicle) => (
                  <TableRow key={vehicle.vehicleId}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{vehicle.plateNumber}</div>
                        <div className="text-xs text-gray-500">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(vehicle.revenue)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(vehicle.expenses.total)}</TableCell>
                    <TableCell className={`text-right font-medium ${vehicle.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(vehicle.netProfit)}
                    </TableCell>
                    <TableCell className={`text-right ${vehicle.roi >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatPercent(vehicle.roi)}
                    </TableCell>
                    <TableCell className="text-right">{vehicle.contractCount}</TableCell>
                  </TableRow>
                ))}
                {(!vehicleProfitability || vehicleProfitability.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No vehicle data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      </div>

      {/* Export Actions */}
      <div className="flex justify-end gap-4 mt-6">
        <Button onClick={handleExportToExcel} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
        <Button onClick={handleExportToPDF} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export to PDF
        </Button>
      </div>
    </div>
    </SidebarLayout>
  );
}
