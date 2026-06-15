export enum AttendanceStatus{
  PRESENT    = "present",
  LATE       = "late",
  PENDING    = "pending",
  PERMISSION = "permission",   // approved permission / leaving early
  LATE_OUT   = "late_out"      // left early WITHOUT permission
}

export type Student = {
  id: string
  profile: string
  name: string
  gender: string
  phone: string
  dateOfBirth: string
  status: AttendanceStatus
  /** Reason/remark recorded with the attendance (late/permission explanation). */
  reason?: string | null
}
