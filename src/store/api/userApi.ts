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
  status?: string;
  profileImage?: string | null;
}

export interface TeacherDto {
  id: number;
  name: string;
  email?: string;
  status?: string;
  profileImage?: string | null;
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
      query: () => "/users?size=1000",
      transformResponse: (response: ApiEnvelope<PagePayload<StudentDto> | StudentDto[]>) =>
        unwrapContent<StudentDto>(response),
      providesTags: ["Student", "User"],
    }),
    getTeachers: builder.query<TeacherDto[], void>({
      query: () => "/teachers?size=1000",
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
    createStudent: builder.mutation<StudentDto, Partial<StudentDto>>({
      query: (body) => ({
        url: "/users/students",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Student", "User"],
    }),
  }),
});

export const {
  useCreateStudentMutation,
  useGetCurrentUserQuery,
  useGetStudentsQuery,
  useGetTeachersQuery,
} = userApi;
