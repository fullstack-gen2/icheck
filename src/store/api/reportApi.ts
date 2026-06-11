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

export interface GenerateReportRequest {
  classroomId: number;
  reportType: "MONTHLY" | "SEMESTER";
  reportYear: number;
  reportMonth?: number;
  semester?: number;
}

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClassroomReports: builder.query<ReportDto[], { classroomId: number; size?: number }>({
      query: ({ classroomId, size = 200 }) => `/reports/classrooms/${classroomId}?size=${size}`,
      transformResponse: (response: ApiEnvelope<PagePayload<ReportDto> | ReportDto[]>) =>
        unwrapContent<ReportDto>(response),
      providesTags: ["Report"],
    }),
    generateReports: builder.mutation<unknown, GenerateReportRequest>({
      query: (body) => ({
        url: "/reports",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Report"],
    }),
    lockReport: builder.mutation<unknown, number>({
      query: (id) => ({
        url: `/reports/${id}/lock`,
        method: "POST",
      }),
      invalidatesTags: ["Report"],
    }),
  }),
});

export const {
  useGenerateReportsMutation,
  useGetClassroomReportsQuery,
  useLockReportMutation,
} = reportApi;
