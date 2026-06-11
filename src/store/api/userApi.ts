import { baseApi, unwrapContent, unwrapPayload, type ApiEnvelope, type PagePayload } from "@/store/api/baseApi";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export interface StudentDto {
  id: number;
  studentNo?: string;
  name: string;
  gender?: string;
  email?: string;
  phone?: string | null;
  className?: string;
  classId?: number | null;
  status?: string;
  profileImage?: string | null;
  deviceId?: string | null;
}

export interface StudentInput {
  studentNo: string;
  name: string;
  gender?: string;
  email: string;
  phone?: string | null;
  classId?: number | null;
  status?: string;
  /** Optional Keycloak username — defaults to email if omitted. */
  username?: string;
  /** Optional initial Keycloak password — required for the student to log in.
   *  If omitted the Keycloak account is created with no credentials. */
  password?: string;
  /** When true Keycloak forces the user to change the password on first login. */
  temporaryPassword?: boolean;
}

export interface TeacherDto {
  id: number;
  name: string;
  email?: string;
  phone?: string | null;
  specialization?: string | null;
  status?: string;
  profileImage?: string | null;
}

export interface TeacherInput {
  name: string;
  email: string;
  phone?: string | null;
  specialization?: string | null;
  /** Optional Keycloak username — defaults to email if omitted. */
  username?: string;
  /** Optional initial Keycloak password — required for the teacher to log in. */
  password?: string;
  /** When true Keycloak forces the user to change the password on first login. */
  temporaryPassword?: boolean;
}

export interface CurrentUserDto {
  id: number | string;
  username?: string;
  name?: string;
  email?: string;
  roles?: string[];
  role?: string;
  roleName?: string;
  profileImage?: string | null;
  [key: string]: unknown;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStudents: builder.query<StudentDto[], void>({
      query: () => "/users/students?size=1000",
      transformResponse: (response: ApiEnvelope<PagePayload<StudentDto> | StudentDto[]>) =>
        unwrapContent<StudentDto>(response),
      providesTags: ["Student", "User"],
    }),
    getTeachers: builder.query<TeacherDto[], void>({
      query: () => "/users/lecturers?size=1000",
      transformResponse: (response: ApiEnvelope<PagePayload<TeacherDto> | TeacherDto[]>) =>
        unwrapContent<TeacherDto>(response),
      providesTags: ["Teacher", "User"],
    }),
    getCurrentUser: builder.query<CurrentUserDto | null, void>({
      async queryFn() {
        try {
          const res = await fetch("/api/auth/me", { credentials: "include" });
          if (!res.ok) return { data: null };
          const json = await res.json();
          return {
            data: unwrapPayload<CurrentUserDto>(json as ApiEnvelope<CurrentUserDto> | CurrentUserDto) ?? null,
          };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "Could not load current user.",
            } satisfies FetchBaseQueryError,
          };
        }
      },
      providesTags: ["User"],
    }),
    createStudent: builder.mutation<StudentDto, Partial<StudentInput>>({
      query: (body) => ({
        url: "/users/students",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<StudentDto>) => unwrapPayload(response),
      invalidatesTags: ["Student", "User"],
    }),
    updateStudent: builder.mutation<StudentDto, { id: number; body: Partial<StudentInput> }>({
      query: ({ id, body }) => ({
        url: `/users/students/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<StudentDto>) => unwrapPayload(response),
      invalidatesTags: ["Student", "User"],
    }),
    deleteStudent: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/students/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Student", "User"],
    }),
    resetStudentDevice: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/students/${id}/device`,
        method: "DELETE",
      }),
      invalidatesTags: ["Student", "User"],
    }),
    createTeacher: builder.mutation<TeacherDto, Partial<TeacherInput>>({
      query: (body) => ({
        url: "/users/lecturers",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<TeacherDto>) => unwrapPayload(response),
      invalidatesTags: ["Teacher", "User"],
    }),
    updateTeacher: builder.mutation<TeacherDto, { id: number; body: Partial<TeacherInput> }>({
      query: ({ id, body }) => ({
        url: `/users/lecturers/${id}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<TeacherDto>) => unwrapPayload(response),
      invalidatesTags: ["Teacher", "User"],
    }),
    deleteTeacher: builder.mutation<void, number>({
      query: (id) => ({
        url: `/users/lecturers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Teacher", "User"],
    }),
  }),
});

export const {
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useResetStudentDeviceMutation,
  useGetCurrentUserQuery,
  useGetStudentsQuery,
  useGetTeachersQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
} = userApi;
