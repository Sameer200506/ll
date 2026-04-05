"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllSchedules, getEnrollmentsByUser } from "@/lib/firestore";
import { Calendar, Video, Clock, ExternalLink, MapPin } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isPast } from "date-fns";

export default function StudentCalendarPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const allSchedules = await getAllSchedules();
      setSchedules(allSchedules);
      setLoading(false);
    })();
  }, [user]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startDay = getDay(days[0]);

  const getEventsForDay = (day: Date) =>
    schedules.filter((s: any) => s.datetime && isSameDay(new Date(s.datetime), day));

  const selectedEvents = getEventsForDay(selectedDate);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const upcomingAll = schedules
    .filter((s: any) => s.datetime && new Date(s.datetime) > new Date())
    .sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

  return (
    <DashboardLayout title="Class Calendar" description="View and join your scheduled live classes.">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}>‹</Button>
                  <Button variant="outline" size="icon" onClick={nextMonth}>›</Button>
                </div>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                  <div key={d} className="text-center text-xs font-semibold py-2 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{d}</div>
                ))}
              </div>
              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {days.map((day) => {
                  const events = getEventsForDay(day);
                  const isSelected = isSameDay(day, selectedDate);
                  const today = isToday(day);
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className="aspect-square flex flex-col items-center justify-center rounded-xl relative transition-all duration-200 text-sm"
                      style={{
                        background: isSelected ? "var(--accent)" : today ? "rgba(108,99,255,0.15)" : "transparent",
                        color: isSelected ? "white" : today ? "var(--accent)" : "var(--text-primary)",
                        fontWeight: today || isSelected ? "700" : "400",
                      }}
                    >
                      {format(day, "d")}
                      {events.length > 0 && (
                        <span className="absolute bottom-1.5 w-1 h-1 rounded-full" style={{ background: isSelected ? "white" : "var(--accent)" }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected day events */}
          <div className="mt-4">
            <h3 className="font-semibold mb-3">{format(selectedDate, "EEEE, MMMM d")}</h3>
            {selectedEvents.length === 0 ? (
              <div className="text-center py-8 rounded-2xl border" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No classes scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((s: any) => (
                  <EventCard key={s.id} schedule={s} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming sidebar */}
        <div>
          <h3 className="font-semibold mb-4">All Upcoming Classes</h3>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)
            ) : upcomingAll.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-8">
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No upcoming classes</p>
                </CardContent>
              </Card>
            ) : upcomingAll.map((s: any) => <EventCard key={s.id} schedule={s} compact />)}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function EventCard({ schedule, compact = false }: { schedule: any; compact?: boolean }) {
  const past = schedule.datetime && isPast(new Date(schedule.datetime));
  return (
    <Card className="card-hover">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: past ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)" }}>
            <Video className="w-5 h-5" style={{ color: past ? "var(--danger)" : "var(--info)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{schedule.courseName}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{schedule.teacherName}</p>
            <div className="flex items-center gap-1 mt-1.5">
              <Clock className="w-3 h-3" style={{ color: "var(--text-secondary)" }} />
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {schedule.datetime ? format(new Date(schedule.datetime), "MMM d, yyyy · h:mm a") : "TBD"}
              </span>
            </div>
            {!compact && (
              <a href={schedule.meetLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                <Button size="sm" className="h-7 px-3 text-xs gap-1" disabled={past}>
                  {past ? "Ended" : <><ExternalLink className="w-3 h-3" /> Join Class</>}
                </Button>
              </a>
            )}
            {compact && !past && (
              <a href={schedule.meetLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                <Button size="sm" className="h-7 px-3 text-xs gap-1">
                  <ExternalLink className="w-3 h-3" /> Join
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
