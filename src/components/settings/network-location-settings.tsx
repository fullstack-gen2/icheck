"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CrosshairIcon,
  LoaderCircleIcon,
  MapPinIcon,
  NetworkIcon,
  PlusIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import {
  useUpsertSettingMutation,
  type SettingDto,
} from "@/store/api/attendanceApi";

export const IP_ENABLED_KEY = "ip_validation_enabled";
export const IP_CIDRS_KEY = "school_ip_cidrs";
export const SCHOOL_LAT_KEY = "school_latitude";
export const SCHOOL_LNG_KEY = "school_longitude";

export const NETWORK_LOCATION_KEYS = [
  IP_ENABLED_KEY,
  IP_CIDRS_KEY,
  SCHOOL_LAT_KEY,
  SCHOOL_LNG_KEY,
];

function findSetting(settings: SettingDto[], key: string) {
  return settings.find((s) => s.settingKey === key);
}

function parseCidrs(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatUpdated(date: string | null | undefined) {
  if (!date) return "Not configured yet";
  return `Updated ${new Date(date).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
}

/** Admin-managed IP allowlist — supports adding/removing multiple IPs/CIDRs. */
export function IpAllowlistCard({ settings }: { settings: SettingDto[] }) {
  const [upsertSetting] = useUpsertSettingMutation();
  const enabledSetting = findSetting(settings, IP_ENABLED_KEY);
  const cidrSetting = findSetting(settings, IP_CIDRS_KEY);

  const enabledValue = enabledSetting?.settingValue;
  const cidrValue = cidrSetting?.settingValue;

  const [enabled, setEnabled] = useState(enabledValue === "true");
  const [cidrs, setCidrs] = useState<string[]>(() => parseCidrs(cidrValue));
  const [newCidr, setNewCidr] = useState("");
  const [savingEnabled, setSavingEnabled] = useState(false);
  const [savingCidrs, setSavingCidrs] = useState(false);
  const [detectedIp, setDetectedIp] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  async function detectIp() {
    setDetecting(true);
    try {
      const res = await fetch("/api/client-ip");
      const json = await res.json();
      setDetectedIp(json?.ip ?? "unknown");
    } catch {
      setDetectedIp("unknown");
    } finally {
      setDetecting(false);
    }
  }

  // Re-sync local state when the underlying settings change (e.g. after refetch),
  // without overwriting in-progress edits on every render.
  const [syncedEnabledValue, setSyncedEnabledValue] = useState(enabledValue);
  if (enabledValue !== syncedEnabledValue) {
    setSyncedEnabledValue(enabledValue);
    setEnabled(enabledValue === "true");
  }

  const [syncedCidrValue, setSyncedCidrValue] = useState(cidrValue);
  if (cidrValue !== syncedCidrValue) {
    setSyncedCidrValue(cidrValue);
    setCidrs(parseCidrs(cidrValue));
  }

  const cidrsChanged = useMemo(() => {
    const original = parseCidrs(cidrSetting?.settingValue).join(",");
    return cidrs.join(",") !== original;
  }, [cidrs, cidrSetting?.settingValue]);

  async function toggleEnabled(next: boolean) {
    if (next === enabled) return;
    setSavingEnabled(true);
    try {
      await upsertSetting({
        key: IP_ENABLED_KEY,
        value: next ? "true" : "false",
        type: "BOOLEAN",
        description: "Require attendance check-ins to originate from an allowed school IP/CIDR",
      }).unwrap();
      setEnabled(next);
      toast.success(`IP validation ${next ? "enabled" : "disabled"}.`);
    } catch {
      toast.error("Failed to update IP validation.");
    } finally {
      setSavingEnabled(false);
    }
  }

  function addCidr() {
    const value = newCidr.trim();
    if (!value) return;
    if (cidrs.includes(value)) {
      toast.error("That entry is already in the list.");
      return;
    }
    setCidrs((prev) => [...prev, value]);
    setNewCidr("");
  }

  function removeCidr(value: string) {
    setCidrs((prev) => prev.filter((c) => c !== value));
  }

  async function saveCidrs() {
    if (cidrs.length === 0) {
      toast.error("Add at least one IP / CIDR before saving — or disable IP validation above.");
      return;
    }
    setSavingCidrs(true);
    try {
      await upsertSetting({
        key: IP_CIDRS_KEY,
        value: cidrs.join(", "),
        type: "STRING",
        description: "Comma-separated list of allowed school IP addresses / CIDR ranges",
      }).unwrap();
      toast.success("School IP allowlist updated.");
    } catch {
      toast.error("Failed to update IP allowlist.");
    } finally {
      setSavingCidrs(false);
    }
  }

  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <NetworkIcon className="size-5" />
        </div>
        <CardTitle>IP Validation</CardTitle>
        <CardDescription>
          Optionally restrict check-ins to specific school networks. Disabled by default-
          when off, students can check in from any network.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className="text-xs text-muted-foreground/70">
              {enabled
                ? "Only the IPs / ranges listed below can submit attendance."
                : "Any network is allowed (default)."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
            <Button
              type="button"
              size="sm"
              variant={enabled ? "default" : "ghost"}
              className={enabled ? "bg-green-600 text-white hover:bg-green-700" : ""}
              disabled={savingEnabled}
              onClick={() => toggleEnabled(true)}
            >
              Enabled
            </Button>
            <Button
              type="button"
              size="sm"
              variant={!enabled ? "default" : "ghost"}
              className={!enabled ? "bg-muted-foreground text-background hover:bg-muted-foreground/80" : ""}
              disabled={savingEnabled}
              onClick={() => toggleEnabled(false)}
            >
              Disabled
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Allowed IPs / CIDR ranges</p>
          {cidrs.length === 0 ? (
            <p className="text-xs text-muted-foreground/70">No entries yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cidrs.map((cidr) => (
                <Badge
                  key={cidr}
                  variant="secondary"
                  className="gap-1.5 py-1.5 pl-3 pr-1.5 font-mono text-xs"
                >
                  {cidr}
                  <button
                    type="button"
                    onClick={() => removeCidr(cidr)}
                    className="rounded-full p-0.5 hover:bg-foreground/10"
                    aria-label={`Remove ${cidr}`}
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newCidr}
              onChange={(e) => setNewCidr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCidr();
                }
              }}
              placeholder="e.g. 203.0.113.0/24 or 192.168.1.10"
              className="h-10 font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={addCidr}
            >
              <PlusIcon className="size-4" />
            </Button>
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">
                On the school Wi-Fi, detect the IP the server actually sees:
              </span>
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5" onClick={detectIp} disabled={detecting}>
                {detecting ? <LoaderCircleIcon className="size-3.5 animate-spin" /> : <CrosshairIcon className="size-3.5" />}
                Detect my IP
              </Button>
            </div>
            {detectedIp && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="font-mono text-foreground">{detectedIp}</span>
                {detectedIp !== "unknown" && !cidrs.includes(detectedIp) && (
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 gap-1.5"
                    onClick={() => { setCidrs((p) => [...p, detectedIp]); toast.success("Added — click Save list."); }}
                  >
                    <PlusIcon className="size-3.5" /> Add to list
                  </Button>
                )}
              </div>
            )}
            {/* <p className="mt-2 text-muted-foreground/70">
              Tip: <span className="font-mono">192.168.x.x</span> is a LAN address a cloud server can&apos;t see it. Use the detected public IP (or its <span className="font-mono">/24</span> range).
            </p> */}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/70">{formatUpdated(cidrSetting?.updatedAt)}</p>
          <Button
            type="button"
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={saveCidrs}
            disabled={!cidrsChanged || savingCidrs}
          >
            {savingCidrs ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            Save list
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Admin-managed default school GPS location, used as a fallback for GPS check-in validation. */
export function SchoolLocationCard({ settings }: { settings: SettingDto[] }) {
  const [upsertSetting] = useUpsertSettingMutation();
  const latSetting = findSetting(settings, SCHOOL_LAT_KEY);
  const lngSetting = findSetting(settings, SCHOOL_LNG_KEY);

  const latValue = latSetting?.settingValue;
  const lngValue = lngSetting?.settingValue;

  const [lat, setLat] = useState(latValue ?? "");
  const [lng, setLng] = useState(lngValue ?? "");
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Re-sync local inputs when the underlying settings change (e.g. after refetch),
  // without overwriting in-progress edits on every render.
  const [syncedLatValue, setSyncedLatValue] = useState(latValue);
  if (latValue !== syncedLatValue) {
    setSyncedLatValue(latValue);
    setLat(latValue ?? "");
  }

  const [syncedLngValue, setSyncedLngValue] = useState(lngValue);
  if (lngValue !== syncedLngValue) {
    setSyncedLngValue(lngValue);
    setLng(lngValue ?? "");
  }

  const changed =
    lat.trim() !== (latSetting?.settingValue ?? "") || lng.trim() !== (lngSetting?.settingValue ?? "");
  const valid =
    lat.trim() !== "" &&
    lng.trim() !== "" &&
    !Number.isNaN(Number(lat)) &&
    !Number.isNaN(Number(lng));

  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      toast.error("Geolocation is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        toast.error("Could not get your current location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function save() {
    if (!valid) return;
    setSaving(true);
    try {
      await Promise.all([
        upsertSetting({
          key: SCHOOL_LAT_KEY,
          value: lat.trim(),
          type: "STRING",
          description:
            "Default school latitude used for GPS check-in validation when a classroom has no location set",
        }).unwrap(),
        upsertSetting({
          key: SCHOOL_LNG_KEY,
          value: lng.trim(),
          type: "STRING",
          description:
            "Default school longitude used for GPS check-in validation when a classroom has no location set",
        }).unwrap(),
      ]);
      toast.success("School location updated.");
    } catch {
      toast.error("Failed to update school location.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="rounded-lg">
      <CardHeader className="gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <MapPinIcon className="size-5" />
        </div>
        <CardTitle>School Location</CardTitle>
        <CardDescription>
          Default GPS coordinates used to validate student check-ins for classrooms that
          don&apos;t have their own location configured.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Latitude</p>
            <Input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="11.5564"
              className="h-11 font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Longitude</p>
            <Input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="104.9282"
              className="h-11 font-mono"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={useCurrentLocation}
          disabled={locating}
        >
          {locating ? (
            <LoaderCircleIcon className="size-4 animate-spin" />
          ) : (
            <CrosshairIcon className="size-4" />
          )}
          Use my current location
        </Button>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/70">{formatUpdated(latSetting?.updatedAt)}</p>
          <Button
            type="button"
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={save}
            disabled={!changed || !valid || saving}
          >
            {saving ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              <SaveIcon className="size-4" />
            )}
            Save location
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
