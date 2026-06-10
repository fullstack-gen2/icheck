"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  ChevronsUpDownIcon,
  UserIcon,
  BellIcon,
  LogOutIcon,
  CameraIcon,
  SaveIcon,
  Trash2Icon,
  LoaderCircleIcon,
} from "lucide-react"
import { useUpdateUser, useUser } from "@/components/user-provider"
import { LOGOUT_URL } from "@/lib/api-config"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function initials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function handleLogout() {
  window.location.assign(LOGOUT_URL);
}

export function NavUser({
  user: serverUser,
}: {
  user: { name: string; email: string; role: string; displayRole?: string; profileImage?: string | null }
}) {
  const { isMobile } = useSidebar()
  
  const liveUser = useUser()
  const updateUser = useUpdateUser()
  const user = liveUser ?? serverUser
  const [profileImage, setProfileImage] = useState(
    "profileImage" in user && user.profileImage ? user.profileImage : ""
  )
  const [saving, setSaving] = useState<"idle" | "saving" | "deleting" | "error">("idle")

  const displayRole =
    "displayRole" in user && user.displayRole
      ? user.displayRole
      : user.role === "ADMIN"
        ? "Admin"
        : user.role === "TEACHER"
          ? "Teacher"
          : user.role === "STUDENT"
            ? "Student"
            : user.role

  const avatarBg = "bg-primary"

  const saveProfileImage = async () => {
    const nextImage = profileImage.trim();
    if (!nextImage || saving !== "idle") return;

    setSaving("saving");
    const res = await fetch("/api/auth/profile-image", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileImage: nextImage }),
    });

    if (res.ok) {
      updateUser?.({ profileImage: nextImage });
      setSaving("idle");
    } else {
      setSaving("error");
    }
  };

  const deleteProfileImage = async () => {
    if (saving !== "idle" || !("profileImage" in user && user.profileImage)) return;

    setSaving("deleting");
    const res = await fetch("/api/auth/profile-image", { method: "DELETE" });

    if (res.ok) {
      setProfileImage("");
      updateUser?.({ profileImage: null });
      setSaving("idle");
    } else {
      setSaving("error");
    }
  };

  const imageUrl = "profileImage" in user ? user.profileImage : null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              onClick={() => setProfileImage(imageUrl ?? "")}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {imageUrl ? <AvatarImage src={imageUrl} alt={user.name || "Profile"} className="rounded-lg" /> : null}
                <AvatarFallback className={`rounded-lg ${avatarBg} text-white text-xs font-semibold`}>
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.name || "—"}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {displayRole}{user.email ? ` · ${user.email}` : ""}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* Profile header */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3 text-left text-sm">
                <Avatar className="h-10 w-10 rounded-xl">
                  {imageUrl ? <AvatarImage src={imageUrl} alt={user.name || "Profile"} className="rounded-xl" /> : null}
                  <AvatarFallback className={`rounded-xl ${avatarBg} text-white text-sm font-semibold`}>
                    {initials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight gap-0.5">
                  <span className="font-semibold text-foreground">{user.name || "—"}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email || "—"}
                  </span>
                  <span className="text-xs font-medium text-primary">
                    {displayRole}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Menu items */}
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-3 py-2.5">
                <UserIcon className="size-4 text-muted-foreground" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="block cursor-default p-3 focus:bg-transparent"
                onSelect={(event) => event.preventDefault()}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <CameraIcon className="size-3.5" />
                    Profile photo URL
                  </div>
                  <Input
                    value={profileImage}
                    onChange={(event) => {
                      setProfileImage(event.target.value);
                      if (saving === "error") setSaving("idle");
                    }}
                    placeholder="https://.../image.jpg"
                    className="h-9 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={saveProfileImage}
                      disabled={!profileImage.trim() || saving !== "idle"}
                      className="gap-1.5"
                    >
                      {saving === "saving" ? (
                        <LoaderCircleIcon className="size-3.5 animate-spin" />
                      ) : (
                        <SaveIcon className="size-3.5" />
                      )}
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={deleteProfileImage}
                      disabled={!imageUrl || saving !== "idle"}
                      className="gap-1.5"
                    >
                      {saving === "deleting" ? (
                        <LoaderCircleIcon className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2Icon className="size-3.5" />
                      )}
                      Remove
                    </Button>
                  </div>
                  {saving === "error" ? (
                    <p className="text-xs text-red-500">Could not update photo. Check the image URL and try again.</p>
                  ) : null}
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 py-2.5">
                <BellIcon className="size-4 text-muted-foreground" />
                <span>Notifications</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Log out */}
            <DropdownMenuItem
              className="gap-3 py-2.5 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30"
              onClick={handleLogout}
            >
              <LogOutIcon className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
