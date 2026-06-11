import { baseApi, unwrapContent, unwrapPayload, type ApiEnvelope, type PagePayload } from "@/store/api/baseApi";

export interface SessionDto {
  id: number;
  classroomId: number;
  classroomName: string;
  subjectName: string;
  teacherName: string;
  substituteTeacherId: number | null;
  substituteTeacherName: string | null;
  substituteReason: string | null;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  actualStartTime: string | null;
  actualEndTime: string | null;
  allowStaticQr: boolean | null;
  isQrActive: boolean | null;
  lateThresholdMinutes: number | null;
  earlyCheckinMinutes: number | null;
  studentAttendanceCutoffMinutes: number | null;
  gpsAllowedRadiusMeters: number | null;
}

export interface QrCodeDto {
  id: number;
  type: "DYNAMIC" | "STATIC";
  codeValue: string;
  expireTime: string | null;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export const qrApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Today's sessions for a classroom — used to find the session to run "Take Attendance" for. */
    getTodaySessionsForClassroom: builder.query<SessionDto[], { classroomId: number }>({
      query: ({ classroomId }) => {
        const today = todayIso();
        return `/sessions/classrooms/${classroomId}?from=${today}&to=${today}&page=0&size=20`;
      },
      transformResponse: (response: ApiEnvelope<PagePayload<SessionDto> | SessionDto[]>) =>
        unwrapContent<SessionDto>(response),
      providesTags: ["Session"],
    }),
    getSession: builder.query<SessionDto, number>({
      query: (sessionId) => `/sessions/${sessionId}`,
      transformResponse: (response: ApiEnvelope<SessionDto>) => unwrapPayload(response),
      providesTags: (_r, _e, id) => [{ type: "Session", id }],
    }),
    /** Teacher manually starts the session (UPCOMING → ACTIVE), required before generating a dynamic QR. */
    openSession: builder.mutation<void, number>({
      query: (sessionId) => ({
        url: `/sessions/${sessionId}/open`,
        method: "POST",
      }),
      invalidatesTags: (_r, _e, id) => [{ type: "Session", id }, "Session"],
    }),
    /** Generates (and rotates) the dynamic QR for an ACTIVE session. */
    generateDynamicQr: builder.mutation<QrCodeDto, number>({
      query: (sessionId) => ({
        url: `/qr-codes/sessions/${sessionId}/dynamic`,
        method: "POST",
      }),
      transformResponse: (response: ApiEnvelope<QrCodeDto>) => unwrapPayload(response),
    }),
    /** Idempotent — returns the classroom's permanent static QR (auto-created when the classroom was made). */
    getClassroomStaticQr: builder.mutation<QrCodeDto, number>({
      query: (classroomId) => ({
        url: `/qr-codes/classrooms/${classroomId}/static`,
        method: "POST",
      }),
      transformResponse: (response: ApiEnvelope<QrCodeDto>) => unwrapPayload(response),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTodaySessionsForClassroomQuery,
  useGetSessionQuery,
  useOpenSessionMutation,
  useGenerateDynamicQrMutation,
  useGetClassroomStaticQrMutation,
} = qrApi;
