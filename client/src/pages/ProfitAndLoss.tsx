import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DatePickerWithYearNav } from "@/components/DatePickerWithYearNav";

interface DetailedBreakdown {
  type: "revenue" | "expenses" | "profit";
  items: any[];
  total: number;
}

export default function ProfitAndLoss() {
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(endOfMonth(new Date()));
  const [selectedBreakdown, setSelectedBreakdown] = useState<DetailedBreakdown | null>(null);

  // Fetch P&L data
  const { data: pnlData, isLoading } = trpc.profitLoss.calculatePnL.useQuery({
    startDate: (startDate || startOfMonth(new Date())).toISOString(),
    endDate: (endDate || endOfMonth(new Date())).toISOString(),
  });

  const metrics = useMemo(() => {
    if (!pnlData) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        vehicleUtilization: 0,
      };
    }

    const revenue = pnlData.totalRevenue || 0;
    const expenses = pnlData.totalExpenses || 0;
    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      totalRevenue: revenue,
      totalExpenses: expenses,
      netProfit: profit,
      profitMargin: margin,
      vehicleUtilization: pnlData.vehicleUtilization || 0,
    };
  }, [pnlData]);

  const handleViewRevenue = () => {
    if (pnlData?.revenueBreakdown) {
      setSelectedBreakdown({
        type: "revenue",
        items: pnlData.revenueBreakdown,
        total: metrics.totalRevenue,
      });
    }
  };

  const handleViewExpenses = () => {
    if (pnlData?.expenseBreakdown) {
      setSelectedBreakdown({
        type: "expenses",
        items: pnlData.expenseBreakdown,
        total: metrics.totalExpenses,
      });
    }
  };

  const handleViewProfit = () => {
    setSelectedBreakdown({
      type: "profit",
      items: [
        { label: "Total Revenue", amount: metrics.totalRevenue },
        { label: "Total Expenses", amount: -metrics.totalExpenses },
        { label: "Net Profit/Loss", amount: metrics.netProfit, isBold: true },
      ],
      total: metrics.netProfit,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Profit & Loss</h1>
        <div className="flex gap-4">
          <div>
            <Label className="text-sm">Start Date</Label>
            <DatePickerWithYearNav
              date={startDate}
              onDateChange={setStartDate}
              placeholder="Select start date"
            />
          </div>
          <div>
            <Label className="text-sm">End Date</Label>
            <DatePickerWithYearNav
              date={endDate}
              onDateChange={setEndDate}
              placeholder="Select end date"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleViewRevenue}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  ${metrics.totalRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Click for details</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleViewExpenses}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  ${metrics.totalExpenses.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Click for details</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Net Profit Card */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleViewProfit}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Net Profit/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${metrics.netProfit.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Click for details</p>
              </div>
              <DollarSign className={`h-8 w-8 ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'} opacity-20`} />
            </div>
          </CardContent>
        </Card>

        {/* Profit Margin Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${metrics.profitMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {metrics.profitMargin.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.profitMargin >= 0 ? 'Healthy' : 'Needs attention'}
                </p>
              </div>
              <Percent className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Utilization Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Fleet Utilization</span>
              <span className="text-2xl font-bold">{metrics.vehicleUtilization.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(metrics.vehicleUtilization, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              Percentage of time vehicles are rented vs idle
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown Modal */}
      <Dialog open={!!selectedBreakdown} onOpenChange={() => setSelectedBreakdown(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedBreakdown?.type === "revenue" && "Revenue Breakdown"}
              {selectedBreakdown?.type === "expenses" && "Expense Breakdown"}
              {selectedBreakdown?.type === "profit" && "Profit Calculation"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedBreakdown?.type === "revenue" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  All invoices and payments collected during the selected period
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedBreakdown.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">
                          {item.clientName} • {new Date(item.invoiceDate).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold text-green-600">${item.amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBreakdown?.type === "expenses" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  All expenses including maintenance, insurance, and other costs
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedBreakdown.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.category}</p>
                        <p className="text-sm text-gray-600">
                          {item.description} • {new Date(item.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold text-red-600">${item.amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedBreakdown?.type === "profit" && (
              <div className="space-y-3">
                {selectedBreakdown.items.map((item, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-4 rounded ${item.isBold ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50'}`}>
                    <p className={item.isBold ? 'font-bold text-lg' : 'font-medium'}>
                      {item.label}
                    </p>
                    <p className={`${item.isBold ? 'font-bold text-lg' : 'font-semibold'} ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.amount >= 0 ? '+' : ''} ${item.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded font-bold">
                <span>Total</span>
                <span className={selectedBreakdown?.total! >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${selectedBreakdown?.total?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
