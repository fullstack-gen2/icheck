import { baseApi, unwrapContent, type ApiEnvelope, type PagePayload } from "@/store/api/baseApi";

export interface ReportDto {
  id: number;
  student?: { id: number; name: string; studentNo?: string };
  reportType: string;
  reportMonth: number | null;
  reportYear: number;
  semester: number | null;
  totalSessions: number;
  presentCount: number;
  leaveEarlyCount?: number | null;
  lateCount: number;
  absentCount: number;
  attendancePercentage: number;
  attendanceScore: number;
  warningStatus: boolean;
  examEligible: boolean;
  locked?: boolean;
  attendanceWeightSnapshot?: number | null;
  latePenaltySnapshot?: number | null;
  leaveEarlyPenaltySnapshot?: number | null;
  absentPenaltySnapshot?: number | null;
  minAttendanceSnapshot?: number | null;
  generatedAt?: string | null;
}

/** Maps to POST /api/v1/reports/monthly — backend generates ONE report per student. */
export interface GenerateMonthlyReportRequest {
  studentId: number;
  classId: number;
  month: number;
  year: number;
}

/** Maps to POST /api/v1/reports/semester — backend generates ONE report per student. */
export interface GenerateSemesterReportRequest {
  studentId: number;
  classId: number;
  semester: number;
  year: number;
}

/** Live, computed-on-the-fly eligibility row (no report generation needed). */
export interface EligibilityDto {
  studentId: number;
  studentNo: string;
  studentName: string;
  totalSessions: number;
  attendedSessions: number;
  lateSessions?: number;
  absentSessions?: number;
  attendancePct: number;
  requiredPct: number;
  eligible: boolean;
  warnings: string[];
}

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClassroomReports: builder.query<ReportDto[], { classroomId: number; size?: number }>({
      query: ({ classroomId, size = 200 }) => `/reports/classrooms/${classroomId}?size=${size}`,
      transformResponse: (response: ApiEnvelope<PagePayload<ReportDto> | ReportDto[]>) =>
        unwrapContent<ReportDto>(response),
      providesTags: ["Report"],
    }),
    /** A student's generated reports (across classes) — used on the student
     *  profile to show the warning count (3 warnings = exam-ineligible). */
    getStudentReports: builder.query<ReportDto[], number>({
      query: (studentId) => `/reports/students/${studentId}?size=200`,
      transformResponse: (response: ApiEnvelope<PagePayload<ReportDto> | ReportDto[]>) =>
        unwrapContent<ReportDto>(response),
      providesTags: ["Report"],
    }),
    /** Live eligibility — actual attendance computed now, shown when no
     *  formal report has been generated for the class yet. */
    getClassroomEligibility: builder.query<EligibilityDto[], number>({
      query: (classroomId) => `/reports/classrooms/${classroomId}/eligibility`,
      transformResponse: (response: ApiEnvelope<EligibilityDto[]> | EligibilityDto[]) =>
        unwrapContent<EligibilityDto>(response),
      providesTags: ["Report"],
    }),
    /** Rule: MONTHLY report is only valid for classrooms whose program type is MONTHLY. */
    generateMonthlyReport: builder.mutation<unknown, GenerateMonthlyReportRequest>({
      query: (body) => ({
        url: "/reports/monthly",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Report"],
    }),
    /** Rule: SEMESTER report is only valid for classrooms whose program type is SEMESTER. */
    generateSemesterReport: builder.mutation<unknown, GenerateSemesterReportRequest>({
      query: (body) => ({
        url: "/reports/semester",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Report"],
    }),
    /** Rule 15 — only admin can lock a report; backend requires ?adminId=. */
    lockReport: builder.mutation<unknown, { id: number; adminId: number }>({
      query: ({ id, adminId }) => ({
        url: `/reports/${id}/lock?adminId=${adminId}`,
        method: "POST",
      }),
      invalidatesTags: ["Report"],
    }),
  }),
});

export const {
  useGenerateMonthlyReportMutation,
  useGenerateSemesterReportMutation,
  useGetClassroomReportsQuery,
  useGetStudentReportsQuery,
  useGetClassroomEligibilityQuery,
  useLockReportMutation,
} = reportApi;
