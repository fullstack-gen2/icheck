import { baseApi, unwrapContent, unwrapPayload, type ApiEnvelope, type PagePayload } from "@/store/api/baseApi";

export interface EnrollmentDto {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  studentNo: string | null;
  classroomId: number;
  classroomName: string;
  status: string | null;
  enrolledAt: string | null;
  enrolledByAdminId: number | null;
  enrolledByAdminName: string | null;
}

export const enrollmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEnrollmentsByClassroom: builder.query<EnrollmentDto[], { classroomId: number; size?: number }>({
      query: ({ classroomId, size = 500 }) => `/classrooms/${classroomId}/enrollments?size=${size}`,
      transformResponse: (response: ApiEnvelope<PagePayload<EnrollmentDto> | EnrollmentDto[]>) =>
        unwrapContent<EnrollmentDto>(response),
      providesTags: (_r, _e, { classroomId }) => [{ type: "Student", id: `enrollments-${classroomId}` }],
    }),
    getEnrollmentsByUser: builder.query<EnrollmentDto[], number>({
      query: (userId) => `/users/${userId}/enrollments`,
      transformResponse: (response: ApiEnvelope<PagePayload<EnrollmentDto> | EnrollmentDto[]>) =>
        unwrapContent<EnrollmentDto>(response),
      providesTags: (_r, _e, userId) => [{ type: "Student", id: `enrollments-user-${userId}` }],
    }),
    enrollStudent: builder.mutation<EnrollmentDto, { classroomId: number; userId: number; enrolledByAdminId?: number | null }>({
      query: ({ classroomId, userId, enrolledByAdminId }) => ({
        url: `/classrooms/${classroomId}/enrollments`,
        method: "POST",
        body: { userId, enrolledByAdminId: enrolledByAdminId ?? null },
      }),
      transformResponse: (response: ApiEnvelope<EnrollmentDto>) => unwrapPayload(response),
      invalidatesTags: (_r, _e, { classroomId, userId }) => [
        { type: "Student", id: `enrollments-${classroomId}` },
        { type: "Student", id: `enrollments-user-${userId}` },
        "Student",
      ],
    }),
    unenrollStudent: builder.mutation<void, { classroomId: number; userId: number }>({
      query: ({ classroomId, userId }) => ({
        url: `/classrooms/${classroomId}/enrollments/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { classroomId, userId }) => [
        { type: "Student", id: `enrollments-${classroomId}` },
        { type: "Student", id: `enrollments-user-${userId}` },
        "Student",
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetEnrollmentsByClassroomQuery,
  useGetEnrollmentsByUserQuery,
  useEnrollStudentMutation,
  useUnenrollStudentMutation,
} = enrollmentApi;
