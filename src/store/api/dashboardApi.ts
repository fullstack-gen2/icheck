import { baseApi, unwrapPayload, type ApiEnvelope } from "@/store/api/baseApi";

export interface AnalyticsSummary {
  totalClasses: number;
  totalStudents: number;
  totalSessions: number;
  sessionsCompleted: number;
  attendanceRate: number;
  present: number;
  late: number;
  lateOut: number;
  permission: number;
  absent: number;
  atRiskStudents: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  present: number;
  late: number;
  lateOut: number;
  permission: number;
  absent: number;
  attendanceRate: number;
}

export interface AnalyticsProgramRow {
  programType: string;
  generation: number | null;
  classes: number;
  students: number;
  attendanceRate: number;
}

export interface AnalyticsClassRow {
  classroomId: number;
  className: string;
  classCode: string;
  attendanceRate: number;
  present: number;
  late: number;
  lateOut: number;
  permission: number;
  absent: number;
  atRiskStudents: number;
}

export interface DashboardAnalytics {
  summary: AnalyticsSummary;
  trend: AnalyticsTrendPoint[];
  programBreakdown: AnalyticsProgramRow[];
  classBreakdown: AnalyticsClassRow[];
}

export interface AnalyticsParams {
  month?: number | null;
  year?: number | null;
  programTypeId?: number | null;
  generation?: number | null;
  classroomId?: number | null;
  shift?: string | null;
  teacherId?: number | null;
  studentId?: number | null;
}

export interface ClassroomLite {
  id: number;
  className: string;
  classCode: string;
  generation: number | null;
  shift: string | null;
  programTypeName: string | null;
}

function buildQuery(params: AnalyticsParams): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") sp.set(key, String(value));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardAnalytics: builder.query<DashboardAnalytics, AnalyticsParams>({
      query: (params) => `/dashboard/analytics${buildQuery(params)}`,
      transformResponse: (response: ApiEnvelope<DashboardAnalytics> | DashboardAnalytics) =>
        unwrapPayload(response),
    }),
    getClassroomsLite: builder.query<ClassroomLite[], void>({
      query: () => `/classrooms?size=300`,
      transformResponse: (
        response: ApiEnvelope<{ content?: ClassroomLite[] }> | { content?: ClassroomLite[] }
      ) => {
        const payload = unwrapPayload(response) as { content?: ClassroomLite[] };
        return payload?.content ?? [];
      },
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardAnalyticsQuery, useGetClassroomsLiteQuery } = dashboardApi;
