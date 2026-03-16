import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Calendar, Car, User, Phone, AlertTriangle, Clock, X } from "lucide-react";
import React, { useState } from "react";
import { Link } from "wouter";

export default function Reservations() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  
  const { data: reservations, isLoading } = trpc.contracts.getFutureReservations.useQuery({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
  });

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Create calendar grid - only current month days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get reservations for a specific day (show for all days the reservation spans)
  const getReservationsForDay = (day: number) => {
    if (!reservations) return [];
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    
    return reservations.filter(reservation => {
      const startDate = new Date(reservation.rentalStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(reservation.rentalEndDate);
      endDate.setHours(0, 0, 0, 0);
      
      // Show reservation on all days from start to end date (inclusive)
      return checkDate.getTime() >= startDate.getTime() && checkDate.getTime() <= endDate.getTime();
    });
  };

  // Check if a reservation is being returned on this specific day
  const isReturnDay = (reservation: any, day: number) => {
    const endDate = new Date(reservation.rentalEndDate);
    endDate.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    checkDate.setHours(0, 0, 0, 0);
    return endDate.getTime() === checkDate.getTime();
  };

  const getRandomColor = (index: number) => {
    const colors = [
      "bg-blue-100 border-blue-300 text-blue-900",
      "bg-green-100 border-green-300 text-green-900",
      "bg-purple-100 border-purple-300 text-purple-900",
      "bg-orange-100 border-orange-300 text-orange-900",
      "bg-pink-100 border-pink-300 text-pink-900",
    ];
    return colors[index % colors.length];
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reservations Calendar</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              View upcoming rental reservations and vehicle availability
            </p>
          </div>
          <Link href="/rental-contracts">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Create New Reservation
            </Button>
          </Link>
        </div>

        {/* Calendar Card */}
        <Card className="shadow-lg border-0">
          {/* Calendar Header with Navigation */}
          <CardHeader className="pb-6 pt-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goToPreviousMonth}
                className="hover:bg-gray-100 h-10 w-10 p-0"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </Button>
              <CardTitle className="text-lg sm:text-2xl font-bold text-gray-900 min-w-0 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goToNextMonth}
                className="hover:bg-gray-100 h-10 w-10 p-0"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-2 sm:p-6">
            {/* Calendar Grid */}
            <div className="overflow-x-auto -mx-2 sm:mx-0">
            <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden min-w-[640px]">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-bold text-gray-700 py-2 sm:py-4 text-xs sm:text-sm bg-gray-50 border-b border-gray-200 border-r last:border-r-0">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="min-h-[100px] sm:min-h-[180px] bg-gray-50 border-r border-b border-gray-200 last:border-r-0" />;
                }
                
                const dayReservations = getReservationsForDay(day);
                const currentDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const isToday = currentDateObj.getTime() === today.getTime();
                const isPast = currentDateObj < today;
                
                return (
                  <div
                    key={day}
                    onClick={() => {
                      setSelectedDate(currentDateObj);
                      setIsDateDialogOpen(true);
                    }}
                    className={`min-h-[100px] sm:min-h-[180px] p-2 sm:p-4 cursor-pointer transition-all hover:bg-blue-50 border-r border-b border-gray-200 last:border-r-0 flex flex-col ${
                      isToday
                        ? "bg-blue-100 border-blue-300"
                        : isPast
                        ? "bg-gray-50"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`text-lg font-bold ${isToday ? "text-blue-700" : "text-gray-800"}`}>
                        {day}
                      </div>
                      {dayReservations.length > 0 && (
                        <div className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                          {dayReservations.length}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 flex-1 overflow-hidden">
                      {dayReservations.slice(0, 2).map((reservation, idx) => {
                        // Calculate rental duration in days
                        const startDate = new Date(reservation.rentalStartDate);
                        const endDate = new Date(reservation.rentalEndDate);
                        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                        
                        // Format dates for display
                        const formattedStartDate = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const formattedEndDate = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        
                        // Create tooltip text
                        const tooltipText = `Contract #${reservation.id}\nVehicle: ${reservation.vehicleBrand} ${reservation.vehicleModel}\nStart: ${formattedStartDate}\nEnd: ${formattedEndDate}\nDuration: ${durationDays} day${durationDays > 1 ? 's' : ''}\nTotal Cost: $${reservation.totalCost?.toFixed(2) || 'N/A'}\nClient: ${reservation.clientName}\nPhone: ${reservation.clientPhone}`;
                        
                        const returnDayBadge = isReturnDay(reservation, day);
                        
                        return (
                          <div
                            key={reservation.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = '/rental-contracts';
                            }}
                            title={tooltipText}
                            className={`text-xs p-2.5 rounded cursor-pointer hover:shadow-md transition-all border ${
                              reservation.hasConflict
                                ? "bg-red-100 border-red-400 text-red-900 hover:bg-red-200"
                                : `${getRandomColor(idx)} hover:opacity-90`
                            }`}
                          >
                            {returnDayBadge && (
                              <div className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-400 text-amber-900 mb-1 inline-block">
                                Return
                              </div>
                            )}
                            
                            <div className="flex items-start gap-1">
                              <Car className="h-3 w-3 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold truncate text-xs">
                                  {reservation.vehicleBrand} {reservation.vehicleModel}
                                </div>
                                <div className="flex items-center gap-0.5 text-[9px] mt-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  <span>{durationDays}d</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {dayReservations.length > 2 && (
                        <div className="text-xs text-gray-600 font-medium px-2 py-1 bg-gray-100 rounded text-center">
                          +{dayReservations.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Date Detail Dialog */}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </DialogTitle>
          </DialogHeader>

          {selectedDate && (
            <div className="space-y-4">
              {getReservationsForDay(selectedDate.getDate()).length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900">Reservations for this day</h3>
                  {getReservationsForDay(selectedDate.getDate()).map((reservation) => {
                    const startDate = new Date(reservation.rentalStartDate);
                    const endDate = new Date(reservation.rentalEndDate);
                    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    const returnDayBadge = isReturnDay(reservation, selectedDate.getDate());

                    return (
                      <div key={reservation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              <Car className="h-4 w-4 text-blue-600" />
                              {reservation.vehicleBrand} {reservation.vehicleModel}
                            </h4>
                            {returnDayBadge && (
                              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded mt-1 inline-block">
                                Return Today
                              </span>
                            )}
                          </div>
                          <span className="text-lg font-bold text-green-600">${reservation.totalCost?.toFixed(2) || 'N/A'}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Rental Period</p>
                            <p className="font-semibold text-gray-900">{durationDays} days</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Contract ID</p>
                            <p className="font-semibold text-gray-900">#{reservation.id}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <User className="h-4 w-4" />
                            <span>{reservation.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700 mt-1">
                            <Phone className="h-4 w-4" />
                            <span>{reservation.clientPhone}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No reservations for this day</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
