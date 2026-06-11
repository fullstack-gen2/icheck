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
  lateCount: number;
  absentCount: number;
  attendancePercentage: number;
  attendanceScore: number;
  warningStatus: boolean;
  examEligible: boolean;
  locked?: boolean;
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

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClassroomReports: builder.query<ReportDto[], { classroomId: number; size?: number }>({
      query: ({ classroomId, size = 200 }) => `/reports/classrooms/${classroomId}?size=${size}`,
      transformResponse: (response: ApiEnvelope<PagePayload<ReportDto> | ReportDto[]>) =>
        unwrapContent<ReportDto>(response),
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
  useLockReportMutation,
} = reportApi;
