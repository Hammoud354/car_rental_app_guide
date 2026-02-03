import MinimalLayout from "@/components/MinimalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ChevronLeft, ChevronRight, Calendar, Car, User, Phone, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function Reservations() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
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

  // Get reservations for a specific day
  const getReservationsForDay = (day: number) => {
    if (!reservations) return [];
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return reservations.filter(reservation => {
      const startDate = new Date(reservation.rentalStartDate);
      const endDate = new Date(reservation.rentalEndDate);
      const checkDate = new Date(dateStr);
      
      return checkDate >= startDate && checkDate <= endDate;
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
    <MinimalLayout>
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
            <Button>
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
                    className={`min-h-[120px] p-2 rounded-lg border ${
                      isToday
                        ? "bg-blue-50 border-blue-300"
                        : isPast
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-2 ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayReservations.map((reservation, idx) => (
                        <Link key={reservation.id} href={`/rental-contracts`}>
                          <div
                            className={`text-xs p-2 rounded cursor-pointer hover:shadow-md transition-shadow ${
                              reservation.hasConflict
                                ? "bg-red-100 border-2 border-red-500 text-red-900"
                                : `border ${getRandomColor(idx)}`
                            }`}
                            title={reservation.hasConflict ? `⚠️ Conflict: This vehicle has ${reservation.conflictCount} overlapping reservation(s)` : ""}
                          >
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
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
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
    </MinimalLayout>
  );
}
