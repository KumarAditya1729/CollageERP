import { CheckCheck, Lock, MapPin, QrCode, Save, ScanLine, UserX, WifiOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { labelize } from "@/hooks/useAcademics";
import {
  readQueue,
  useMarkAttendance,
  useSessionRoster,
  writeQueue,
  type AttendanceSessionRow,
} from "@/hooks/useAttendance";
import { useOnline } from "@/hooks/useOnline";
import {
  attendanceModes,
  attendanceStatuses,
  distanceMeters,
  statusTone,
  type AttendanceMode,
  type AttendanceStatus,
} from "@/lib/attendance";

/**
 * Roster marking surface. Supports manual marking, scan-driven methods
 * (barcode / RFID / NFC / QR identifier entry), GPS validation and an
 * offline queue that syncs when connectivity returns.
 */
export function AttendanceRoster({
  session,
  canManage,
}: {
  session: AttendanceSessionRow;
  canManage: boolean;
}) {
  const roster = useSessionRoster(session);
  const mark = useMarkAttendance();
  const online = useOnline();

  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  const [search, setSearch] = useState("");
  const [scan, setScan] = useState("");
  const [mode, setMode] = useState<AttendanceMode>(session.mode ?? "manual");
  const [notify, setNotify] = useState(true);
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [queued, setQueued] = useState(() =>
    readQueue().filter((row) => row.sessionId === session.id),
  );

  useEffect(() => {
    setDraft({});
  }, [session.id]);

  const members = roster.data ?? [];
  const statusOf = (id: string, fallback: AttendanceStatus) => draft[id] ?? fallback;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return members;
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(term) ||
        (member.identifier ?? "").toLowerCase().includes(term),
    );
  }, [members, search]);

  const counts = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const member of members) {
      const status = statusOf(member.id, member.status);
      tally[status] = (tally[status] ?? 0) + 1;
    }
    return tally;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, draft]);

  const present = (counts.present ?? 0) + (counts.late ?? 0) + (counts.on_duty ?? 0);
  const percentage = members.length ? Math.round((present / members.length) * 100) : 0;

  const setAll = (status: AttendanceStatus) =>
    setDraft(Object.fromEntries(members.map((member) => [member.id, status])));

  const applyScan = (value: string) => {
    const term = value.trim().toLowerCase();
    if (!term) return;
    const match = members.find(
      (member) => (member.identifier ?? "").toLowerCase() === term || member.id === term,
    );
    if (!match) {
      toast.error(`No one matches “${value}”`);
      return;
    }
    setDraft((prev) => ({ ...prev, [match.id]: "present" }));
    toast.success(`${match.name} marked present`);
    setScan("");
  };

  const captureGps = () => {
    if (!navigator.geolocation) {
      toast.error("This device cannot report a location");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        setGps(point);
        if (session.gps_latitude != null && session.gps_longitude != null) {
          const away = distanceMeters(point, {
            lat: Number(session.gps_latitude),
            lng: Number(session.gps_longitude),
          });
          const radius = session.gps_radius_m ?? 100;
          if (away > radius) toast.error(`You are ${away} m away — outside the ${radius} m fence`);
          else toast.success(`Location verified (${away} m from the class)`);
        }
      },
      () => toast.error("Location permission was declined"),
    );
  };

  const save = async () => {
    const marks = members.map((member) => ({
      memberId: member.id,
      status: statusOf(member.id, member.status),
    }));
    if (!online) {
      const batch = {
        id: crypto.randomUUID(),
        sessionId: session.id,
        savedAt: new Date().toISOString(),
        marks,
      };
      const next = [...readQueue(), batch];
      writeQueue(next);
      setQueued(next.filter((row) => row.sessionId === session.id));
      toast.warning("Saved offline — it will sync when you reconnect");
      return;
    }
    await mark.mutateAsync({ session, marks, mode, notifyAbsentees: notify });
    setDraft({});
  };

  const syncQueue = async () => {
    const all = readQueue();
    const mine = all.filter((row) => row.sessionId === session.id);
    for (const batch of mine) {
      await mark.mutateAsync({ session, marks: batch.marks, mode: "bulk", notifyAbsentees: false });
    }
    const rest = all.filter((row) => row.sessionId !== session.id);
    writeQueue(rest);
    setQueued([]);
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Roll call</CardTitle>
            <CardDescription>
              {members.length}{" "}
              {session.attendee_kind === "student" ? "students" : session.attendee_kind}
              {" · "}
              {labelize(session.session_type)} on {session.session_date}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {session.is_locked ? (
              <Badge variant="destructive" className="gap-1">
                <Lock className="size-3" /> Frozen
              </Badge>
            ) : null}
            {!online ? (
              <Badge variant="outline" className="gap-1">
                <WifiOff className="size-3" /> Offline
              </Badge>
            ) : null}
            {session.qr_token ? (
              <Badge variant="secondary" className="gap-1">
                <QrCode className="size-3" /> {session.qr_token}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="space-y-1">
          <Progress value={percentage} />
          <p className="text-xs text-muted-foreground">
            {present} marked in attendance · {counts.absent ?? 0} absent · {percentage}%
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="roster-search">Search</Label>
            <Input
              id="roster-search"
              placeholder="Name or roll number"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="roster-scan">Scan / tap identifier</Label>
            <div className="flex gap-2">
              <Input
                id="roster-scan"
                placeholder="Barcode, RFID or NFC id"
                value={scan}
                onChange={(event) => setScan(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyScan(scan);
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => applyScan(scan)}
                aria-label="Apply scan"
              >
                <ScanLine className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Method</Label>
            <Select value={mode} onValueChange={(value) => setMode(value as AttendanceMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {attendanceModes.map((value) => (
                  <SelectItem key={value} value={value}>
                    {labelize(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Location check</Label>
            <Button variant="outline" className="w-full justify-start" onClick={captureGps}>
              <MapPin className="size-4" />
              {gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : "Verify my location"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAll("present")}
            disabled={!canManage}
          >
            <CheckCheck className="size-4" />
            All present
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAll("absent")}
            disabled={!canManage}
          >
            <UserX className="size-4" />
            All absent
          </Button>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <Switch checked={notify} onCheckedChange={setNotify} aria-label="Notify guardians" />
            Notify guardians of absentees
          </label>
        </div>

        {queued.length > 0 ? (
          <div className="flex items-center justify-between rounded-lg border border-dashed p-3 text-sm">
            <span>{queued.length} offline batch(es) waiting to sync.</span>
            <Button size="sm" variant="outline" disabled={!online} onClick={() => void syncQueue()}>
              Sync now
            </Button>
          </div>
        ) : null}

        {roster.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading roster…</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No one to mark"
            description="Add students to this section or enrol them into the subject first."
          />
        ) : (
          <div className="max-h-[32rem] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Identifier</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-56">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((member) => {
                  const status = statusOf(member.id, member.status);
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-mono text-xs">
                        {member.identifier ?? "—"}
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          {member.name}
                          <Badge variant={statusTone(status)} className="hidden sm:inline-flex">
                            {labelize(status)}
                          </Badge>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={status}
                          disabled={!canManage || session.is_locked}
                          onValueChange={(value) =>
                            setDraft((prev) => ({
                              ...prev,
                              [member.id]: value as AttendanceStatus,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {attendanceStatuses.map((value) => (
                              <SelectItem key={value} value={value}>
                                {labelize(value)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <Button
          disabled={!canManage || session.is_locked || mark.isPending || members.length === 0}
          onClick={() => void save()}
        >
          <Save className="size-4" />
          Save attendance
        </Button>
      </CardContent>
    </Card>
  );
}
