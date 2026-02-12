import SidebarLayout from "@/components/SidebarLayout";
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

  // Create calendar grid
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get reservations for a specific day (only show on start date)
  const getReservationsForDay = (day: number) => {
    if (!reservations) return [];
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return reservations.filter(reservation => {
      const startDate = new Date(reservation.rentalStartDate);
      startDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(dateStr);
      checkDate.setHours(0, 0, 0, 0);
      
      // Only show reservation on its start date
      return startDate.getTime() === checkDate.getTime();
    });
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
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reservations Calendar</h1>
            <p className="text-gray-600 mt-2">
              View upcoming rental reservations and vehicle availability
            </p>
          </div>
          <Link href="/rental-contracts">
            <Button className="bg-gray-900 hover:bg-gray-800">
              <Calendar className="h-4 w-4 mr-2" />
              Create New Reservation
            </Button>
          </Link>
        </div>

        {/* Calendar Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="min-h-[120px] bg-gray-50 rounded-lg" />;
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
                    className={`min-h-[120px] p-2 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                      isToday
                        ? "bg-blue-50 border-blue-300"
                        : isPast
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-sm font-semibold ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                        {day}
                      </div>
                      {dayReservations.length > 0 && (
                        <div className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {dayReservations.length}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayReservations.map((reservation, idx) => {
                        // Calculate rental duration in days
                        const startDate = new Date(reservation.rentalStartDate);
                        const endDate = new Date(reservation.rentalEndDate);
                        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                        
                        // Format dates for display
                        const formattedStartDate = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        const formattedEndDate = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        
                        // Create tooltip text
                        const tooltipText = `Contract #${reservation.id}\nVehicle: ${reservation.vehicleBrand} ${reservation.vehicleModel}\nStart: ${formattedStartDate}\nEnd: ${formattedEndDate}\nDuration: ${durationDays} day${durationDays > 1 ? 's' : ''}\nTotal Cost: $${reservation.totalCost?.toFixed(2) || 'N/A'}\nClient: ${reservation.clientName}\nPhone: ${reservation.clientPhone}`;
                        
                        return (
                            <div
                              key={reservation.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = '/rental-contracts';
                              }}
                              title={tooltipText}
                              className={`text-xs p-2 rounded cursor-pointer hover:shadow-md transition-shadow relative ${
                                reservation.hasConflict
                                  ? "bg-red-100 border-2 border-red-500 text-red-900"
                                  : `border ${getRandomColor(idx)}`
                              }`}
                            >
                            {/* Duration indicator in top-right corner */}
                            <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-white/90 px-1 py-0.5 rounded text-[9px] font-semibold text-gray-700 shadow-sm">
                              <Clock className="h-2.5 w-2.5" />
                              <span>{durationDays}d</span>
                            </div>
                            
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <div className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                <span className="font-semibold truncate">
                                  {reservation.vehicleBrand} {reservation.vehicleModel}
                                </span>
                              </div>
                              {reservation.hasConflict && (
                                <AlertTriangle className="h-3 w-3 text-red-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <User className="h-2.5 w-2.5" />
                              <span className="truncate">{reservation.clientName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <Phone className="h-2.5 w-2.5" />
                              <span className="truncate">{reservation.clientPhone}</span>
                            </div>
                            {reservation.hasConflict && (
                              <div className="mt-1 text-[9px] font-semibold text-red-700">
                                ⚠️ {reservation.conflictCount} conflict{reservation.conflictCount > 1 ? 's' : ''}
                              </div>
                            )}
                            </div>
                        );
                      })}
                    </div>
                  </div>
                );              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Calendar Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
                <span>Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
                <span>Past Date</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
                <span>Future Date</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="text-center py-8 text-gray-500">Loading reservations...</div>
        )}
      </div>

      {/* Date Details Dialog */}
      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Reservations for {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedDate && (() => {
              const day = selectedDate.getDate();
              const dayReservations = getReservationsForDay(day);
              
              if (dayReservations.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No reservations scheduled for this date</p>
                  </div>
                );
              }
              
              return dayReservations.map((reservation, idx) => {
                const startDate = new Date(reservation.rentalStartDate);
                const endDate = new Date(reservation.rentalEndDate);
                const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <Card key={reservation.id} className={reservation.hasConflict ? "border-red-500" : ""}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Car className="h-5 w-5" />
                          <span>{reservation.vehicleBrand} {reservation.vehicleModel}</span>
                        </div>
                        {reservation.hasConflict && (
                          <div className="flex items-center gap-1 text-red-600 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Conflict</span>
                          </div>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Client
                          </div>
                          <div className="font-medium">{reservation.clientName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            Phone
                          </div>
                          <div className="font-medium">{reservation.clientPhone}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Start Date
                          </div>
                          <div className="font-medium">{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            End Date
                          </div>
                          <div className="font-medium">{endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Duration
                          </div>
                          <div className="font-medium">{durationDays} day{durationDays > 1 ? 's' : ''}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Total Cost</div>
                          <div className="font-medium text-lg">${reservation.totalCost?.toFixed(2) || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Link href="/rental-contracts" className="flex-1">
                          <Button variant="outline" className="w-full">View Contract</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
