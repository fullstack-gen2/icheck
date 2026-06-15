export enum AttendanceStatus{
  PRESENT = "present",
  LATE    = "late",
  PENDING = "pending"
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
