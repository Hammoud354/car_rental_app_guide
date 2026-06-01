import { useState } from "react";

type Reservation = {
  id: number;
  vehicleName: string;
  plateNumber: string;
  clientName: string;
  clientPhone: string;
  startDate: Date;
  endDate: Date;
  status: "active" | "upcoming" | "overdue";
  paymentStatus: "paid" | "pending" | "partial";
  contractNumber: string;
  dailyRate: number;
  totalCost: number;
  colorKey: keyof typeof COLOR_MAP;
  pickupTime: string;
  returnTime: string;
};

const COLOR_MAP = {
  blue:    { bar: "bg-blue-500",    border: "border-blue-600",   label: "text-white" },
  emerald: { bar: "bg-emerald-500", border: "border-emerald-600",label: "text-white" },
  violet:  { bar: "bg-violet-500",  border: "border-violet-600", label: "text-white" },
  orange:  { bar: "bg-orange-500",  border: "border-orange-600", label: "text-white" },
  pink:    { bar: "bg-pink-500",    border: "border-pink-600",   label: "text-white" },
  indigo:  { bar: "bg-indigo-500",  border: "border-indigo-600", label: "text-white" },
  rose:    { bar: "bg-rose-500",    border: "border-rose-600",   label: "text-white" },
  teal:    { bar: "bg-teal-500",    border: "border-teal-600",   label: "text-white" },
  amber:   { bar: "bg-amber-500",   border: "border-amber-600",  label: "text-white" },
  cyan:    { bar: "bg-cyan-600",    border: "border-cyan-700",   label: "text-white" },
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  upcoming: "bg-blue-100 text-blue-800",
  overdue: "bg-red-100 text-red-800",
};

const PAYMENT_COLORS: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  partial: "bg-orange-100 text-orange-700",
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function makeMockData(year: number, month: number): Reservation[] {
  const d = (day: number) => new Date(year, month, day, 0, 0, 0, 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mid = Math.floor(daysInMonth / 2);
  return [
    { id: 1,  vehicleName: "Tesla Model 3",       plateNumber: "AB-1234", clientName: "John Miller",    clientPhone: "+1 555-0101", startDate: d(1),       endDate: d(8),         status:"active",   paymentStatus:"paid",    contractNumber:"#C-2601", dailyRate:85,  totalCost:595,  colorKey:"blue",    pickupTime:"09:00", returnTime:"18:00" },
    { id: 2,  vehicleName: "BMW X5",               plateNumber: "CD-5678", clientName: "Sarah Johnson",  clientPhone: "+1 555-0202", startDate: d(3),       endDate: d(15),        status:"active",   paymentStatus:"pending", contractNumber:"#C-2602", dailyRate:120, totalCost:1440, colorKey:"emerald", pickupTime:"10:30", returnTime:"16:00" },
    { id: 3,  vehicleName: "Mercedes C-Class",     plateNumber: "EF-9012", clientName: "Bob Wilson",     clientPhone: "+1 555-0303", startDate: d(5),       endDate: d(9),         status:"upcoming", paymentStatus:"paid",    contractNumber:"#C-2603", dailyRate:95,  totalCost:380,  colorKey:"violet",  pickupTime:"08:00", returnTime:"20:00" },
    { id: 4,  vehicleName: "Toyota Camry",         plateNumber: "GH-3456", clientName: "Alice Brown",    clientPhone: "+1 555-0404", startDate: d(10),      endDate: d(mid),       status:"upcoming", paymentStatus:"paid",    contractNumber:"#C-2604", dailyRate:65,  totalCost:650,  colorKey:"orange",  pickupTime:"12:00", returnTime:"12:00" },
    { id: 5,  vehicleName: "Honda CR-V",           plateNumber: "IJ-7890", clientName: "Charlie Davis",  clientPhone: "+1 555-0505", startDate: d(mid-2),   endDate: d(mid+6),     status:"upcoming", paymentStatus:"partial", contractNumber:"#C-2605", dailyRate:70,  totalCost:560,  colorKey:"pink",    pickupTime:"14:00", returnTime:"14:00" },
    { id: 6,  vehicleName: "Audi A4",              plateNumber: "KL-1234", clientName: "Diana Evans",    clientPhone: "+1 555-0606", startDate: d(mid+1),   endDate: d(mid+8),     status:"upcoming", paymentStatus:"paid",    contractNumber:"#C-2606", dailyRate:110, totalCost:880,  colorKey:"indigo",  pickupTime:"11:00", returnTime:"11:00" },
    { id: 7,  vehicleName: "Ford F-150",           plateNumber: "MN-5678", clientName: "Eve Foster",     clientPhone: "+1 555-0707", startDate: d(mid+3),   endDate: d(daysInMonth), status:"upcoming", paymentStatus:"pending", contractNumber:"#C-2607", dailyRate:80,  totalCost:1040, colorKey:"rose",    pickupTime:"09:30", returnTime:"17:30" },
    { id: 8,  vehicleName: "Chevrolet Malibu",     plateNumber: "OP-9012", clientName: "Frank Garcia",   clientPhone: "+1 555-0808", startDate: d(1),       endDate: d(3),         status:"active",   paymentStatus:"paid",    contractNumber:"#C-2608", dailyRate:60,  totalCost:180,  colorKey:"teal",    pickupTime:"08:30", returnTime:"08:30" },
    { id: 9,  vehicleName: "Hyundai Tucson",       plateNumber: "QR-3456", clientName: "Grace Harris",   clientPhone: "+1 555-0909", startDate: d(mid),     endDate: d(mid+4),     status:"upcoming", paymentStatus:"paid",    contractNumber:"#C-2609", dailyRate:72,  totalCost:360,  colorKey:"amber",   pickupTime:"10:00", returnTime:"18:00" },
    { id: 10, vehicleName: "Volkswagen Golf",      plateNumber: "ST-7890", clientName: "Henry Irving",   clientPhone: "+1 555-1010", startDate: d(mid+5),   endDate: d(mid+12 > daysInMonth ? daysInMonth : mid+12), status:"upcoming", paymentStatus:"pending", contractNumber:"#C-2610", dailyRate:55,  totalCost:440,  colorKey:"cyan",    pickupTime:"13:00", returnTime:"13:00" },
  ];
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function durationDays(r: Reservation) {
  return Math.round((dayOnly(r.endDate).getTime() - dayOnly(r.startDate).getTime()) / 86400000) + 1;
}

type WeekRow = {
  days: (Date | null)[];
  weekStart: Date;
  weekEnd: Date;
};

function buildWeeks(year: number, month: number): WeekRow[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay.getDay();
  const weeks: WeekRow[] = [];
  let dayOfMonth = 1;
  let row: (Date | null)[] = [];

  for (let i = 0; i < offset; i++) row.push(null);
  while (dayOfMonth <= daysInMonth) {
    row.push(new Date(year, month, dayOfMonth));
    dayOfMonth++;
    if (row.length === 7) {
      const first = row.find((d) => d !== null)!;
      const last = [...row].reverse().find((d) => d !== null)!;
      weeks.push({ days: row, weekStart: first, weekEnd: last });
      row = [];
    }
  }
  if (row.length > 0) {
    while (row.length < 7) row.push(null);
    const first = row.find((d) => d !== null)!;
    const last = [...row].reverse().find((d) => d !== null)!;
    weeks.push({ days: row, weekStart: first, weekEnd: last });
  }
  return weeks;
}

type BarSegment = {
  reservation: Reservation;
  colStart: number;
  colSpan: number;
  isStart: boolean;
  isEnd: boolean;
};

function getWeekSegments(week: WeekRow, reservations: Reservation[]): BarSegment[][] {
  const segments: BarSegment[] = [];

  for (const r of reservations) {
    const rStart = dayOnly(r.startDate);
    const rEnd = dayOnly(r.endDate);
    const wStart = dayOnly(week.weekStart);
    const wEnd = dayOnly(week.weekEnd);

    if (rEnd < wStart || rStart > wEnd) continue;

    const clampedStart = rStart < wStart ? wStart : rStart;
    const clampedEnd = rEnd > wEnd ? wEnd : rEnd;

    const colStart = week.days.findIndex((d) => d && isSameDay(d, clampedStart));
    const colEndDay = week.days.findIndex((d) => d && isSameDay(d, clampedEnd));
    const colEnd = colEndDay >= 0 ? colEndDay : 6;
    const colSpan = colEnd - colStart + 1;

    segments.push({
      reservation: r,
      colStart,
      colSpan,
      isStart: isSameDay(rStart, clampedStart),
      isEnd: isSameDay(rEnd, clampedEnd),
    });
  }

  segments.sort((a, b) => a.reservation.startDate.getTime() - b.reservation.startDate.getTime() || b.colSpan - a.colSpan);

  const tracks: BarSegment[][] = [];
  for (const seg of segments) {
    let placed = false;
    for (const track of tracks) {
      const last = track[track.length - 1];
      if (last.colStart + last.colSpan <= seg.colStart) {
        track.push(seg);
        placed = true;
        break;
      }
    }
    if (!placed) tracks.push([seg]);
  }
  return tracks;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function TimelineCalendar() {
  const today = dayOnly(new Date());
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Reservation | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeks = buildWeeks(year, month);
  const reservations = makeMockData(year, month);

  const totalActive = reservations.filter((r) => r.status === "active").length;
  const pickedToday = reservations.filter((r) => isSameDay(r.startDate, today)).length;
  const returnsToday = reservations.filter((r) => isSameDay(r.endDate, today)).length;

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reservations Calendar</h1>
            <p className="text-sm text-gray-500 mt-0.5">Timeline view of all vehicle rentals</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Reservation
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active Rentals", value: totalActive, color: "text-green-600", bg: "bg-green-50 border-green-200" },
            { label: "Pickups Today", value: pickedToday, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
            { label: "Returns Today", value: returnsToday, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-3 sm:p-4 ${s.bg} flex items-center gap-3`}>
              <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
              <span className="text-xs sm:text-sm text-gray-600 font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Calendar Nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">{MONTH_NAMES[month]} {year}</h2>
              <button onClick={goToday} className="px-3 py-1 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full border border-blue-200 transition-colors">Today</button>
            </div>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Week rows */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {weeks.map((week, wi) => {
                const tracks = getWeekSegments(week, reservations);
                const numTracks = tracks.length;
                const barHeight = 26;
                const barGap = 4;
                const headerHeight = 52;
                const minReservedHeight = numTracks > 0 ? numTracks * (barHeight + barGap) + 8 : 0;
                const rowHeight = Math.max(headerHeight + minReservedHeight, headerHeight + 20);

                return (
                  <div key={wi} className="relative border-b border-gray-100 last:border-b-0" style={{ height: rowHeight }}>
                    {/* Day cells */}
                    <div className="grid grid-cols-7 h-full absolute inset-0">
                      {week.days.map((day, di) => {
                        const isToday = day && isSameDay(day, today);
                        const isPast = day && day < today;
                        const isOtherMonth = !day;
                        const pickupCount = day ? reservations.filter(r => isSameDay(r.startDate, day)).length : 0;
                        const returnCount = day ? reservations.filter(r => isSameDay(r.endDate, day)).length : 0;
                        const activeCount = day ? reservations.filter(r => {
                          const rs = dayOnly(r.startDate);
                          const re = dayOnly(r.endDate);
                          return rs <= day && day <= re;
                        }).length : 0;

                        return (
                          <div
                            key={di}
                            className={`border-r border-gray-100 last:border-r-0 flex flex-col ${
                              isOtherMonth ? "bg-gray-50" :
                              isToday ? "bg-blue-50" :
                              isPast ? "bg-gray-50/60" :
                              "bg-white"
                            }`}
                          >
                            {day && (
                              <div className="px-2 pt-2 flex flex-col gap-0.5" style={{ minHeight: headerHeight }}>
                                {/* Date number */}
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm font-bold leading-none ${isToday ? "h-6 w-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs" : "text-gray-800"}`}>
                                    {day.getDate()}
                                  </span>
                                  {activeCount > 0 && (
                                    <span className="text-[10px] font-semibold text-gray-500">{activeCount} rental{activeCount > 1 ? "s" : ""}</span>
                                  )}
                                </div>
                                {/* Badges */}
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {pickupCount > 0 && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-800 text-[9px] font-bold rounded-full leading-none">
                                      ↑ {pickupCount > 1 ? `${pickupCount} ` : ""}Pickup{pickupCount > 1 ? "s" : ""}
                                    </span>
                                  )}
                                  {returnCount > 0 && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-800 text-[9px] font-bold rounded-full leading-none">
                                      ↓ {returnCount > 1 ? `${returnCount} ` : ""}Return{returnCount > 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Reservation bars overlay */}
                    <div className="absolute inset-0 pointer-events-none" style={{ top: headerHeight }}>
                      {tracks.map((track, ti) =>
                        track.map((seg) => {
                          const c = COLOR_MAP[seg.reservation.colorKey];
                          const leftPct = (seg.colStart / 7) * 100;
                          const widthPct = (seg.colSpan / 7) * 100;
                          const topPx = ti * (barHeight + barGap) + 4;
                          const dur = durationDays(seg.reservation);

                          return (
                            <div
                              key={seg.reservation.id + "-" + ti}
                              className="absolute pointer-events-auto cursor-pointer flex items-center overflow-hidden group"
                              style={{
                                left: `calc(${leftPct}% + ${seg.isStart ? 4 : 0}px)`,
                                width: `calc(${widthPct}% - ${(seg.isStart ? 4 : 0) + (seg.isEnd ? 4 : 0)}px)`,
                                top: topPx,
                                height: barHeight,
                                borderRadius: `${seg.isStart ? "6px" : "0"} ${seg.isEnd ? "6px" : "0"} ${seg.isEnd ? "6px" : "0"} ${seg.isStart ? "6px" : "0"}`,
                              }}
                              onClick={() => setSelected(seg.reservation)}
                            >
                              <div
                                className={`h-full w-full ${c.bar} ${c.label} flex items-center px-2 gap-1.5 group-hover:opacity-90 transition-opacity`}
                                style={{
                                  borderRadius: "inherit",
                                  borderLeft: seg.isStart ? undefined : "none",
                                  minWidth: 0,
                                }}
                              >
                                {seg.isStart && (
                                  <>
                                    <svg className="h-3 w-3 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                    <span className="text-[11px] font-semibold truncate leading-none">
                                      {seg.reservation.vehicleName}
                                      <span className="opacity-75 font-normal ml-1">{dur}d</span>
                                    </span>
                                    {seg.colSpan >= 3 && (
                                      <span className="text-[10px] opacity-75 truncate hidden sm:block">{seg.reservation.clientName}</span>
                                    )}
                                  </>
                                )}
                                {!seg.isStart && seg.colSpan >= 2 && (
                                  <span className="text-[10px] opacity-75 truncate">{seg.reservation.vehicleName}</span>
                                )}
                              </div>
                              {!seg.isEnd && (
                                <div
                                  className={`absolute right-0 top-0 h-full w-3 ${c.bar}`}
                                  style={{ clipPath: "polygon(0 0, 0 100%, 100% 50%)" }}
                                />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-4 bg-gray-50/50">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-gray-500">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-500">Upcoming</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-800 text-[9px] font-bold rounded-full">↑ Pickup</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-800 text-[9px] font-bold rounded-full">↓ Return</span>
            </div>
            <div className="ml-auto text-xs text-gray-400">Click a reservation bar to view details</div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header bar color strip */}
            <div className={`h-1.5 ${COLOR_MAP[selected.colorKey].bar}`} />

            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selected.vehicleName}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{selected.plateNumber}</p>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Status badges */}
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[selected.status]}`}>
                    {selected.status}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${PAYMENT_COLORS[selected.paymentStatus]}`}>
                    {selected.paymentStatus}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {selected.contractNumber}
                  </span>
                </div>

                {/* Client */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-blue-700">{selected.clientName[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selected.clientName}</p>
                    <p className="text-xs text-gray-500">{selected.clientPhone}</p>
                  </div>
                </div>

                {/* Dates grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                    <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wide mb-1">Pickup</p>
                    <p className="text-sm font-bold text-gray-900">{formatDate(selected.startDate)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selected.pickupTime}</p>
                  </div>
                  <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
                    <p className="text-[10px] font-semibold text-orange-700 uppercase tracking-wide mb-1">Return</p>
                    <p className="text-sm font-bold text-gray-900">{formatDate(selected.endDate)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{selected.returnTime}</p>
                  </div>
                </div>

                {/* Duration & rate */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{durationDays(selected)}d</p>
                    <p className="text-[10px] text-gray-500">Duration</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">${selected.dailyRate}</p>
                    <p className="text-[10px] text-gray-500">Daily Rate</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-green-700">${selected.totalCost}</p>
                    <p className="text-[10px] text-gray-500">Total</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                    View Contract
                  </button>
                  <button className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
