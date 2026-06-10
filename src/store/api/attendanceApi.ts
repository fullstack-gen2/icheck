import { baseApi, unwrapContent, type ApiEnvelope, type PagePayload } from "@/store/api/baseApi";

export interface ClassroomDto {
  id: number;
  className: string;
  classCode: string;
  programTypeName: string;
  generation: number;
  year: number | null;
  semester: number | null;
  shift: string;
  academicYear?: number;
  startDate?: string;
  endDate?: string;
  status: boolean;
}

export interface SettingDto {
  id: number;
  settingKey: string;
  settingValue: string;
  type: string;
  description: string | null;
  updatedAt: string | null;
}

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClassrooms: builder.query<ClassroomDto[], { size?: number } | void>({
      query: (params) => `/classrooms?size=${params?.size ?? 200}`,
      transformResponse: (response: ApiEnvelope<PagePayload<ClassroomDto> | ClassroomDto[]>) =>
        unwrapContent<ClassroomDto>(response),
      providesTags: ["Classroom"],
    }),
    createClassroom: builder.mutation<ClassroomDto, Partial<ClassroomDto>>({
      query: (body) => ({
        url: "/classrooms",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Classroom"],
    }),
    updateClassroom: builder.mutation<ClassroomDto, { id: number; body: Partial<ClassroomDto> }>({
      query: ({ id, body }) => ({
        url: `/classrooms/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Classroom"],
    }),
    getSettings: builder.query<SettingDto[], void>({
      query: () => "/settings",
      transformResponse: (response: ApiEnvelope<SettingDto[]>) =>
        response.payload ?? [],
      providesTags: ["Setting"],
    }),
    updateSetting: builder.mutation<SettingDto, { key: string; value: string }>({
      query: ({ key, value }) => ({
        url: `/settings/${encodeURIComponent(key)}`,
        method: "PATCH",
        body: { value },
      }),
      invalidatesTags: ["Setting"],
    }),
  }),
});

export const {
  useCreateClassroomMutation,
  useGetClassroomsQuery,
  useGetSettingsQuery,
  useUpdateClassroomMutation,
  useUpdateSettingMutation,
} = attendanceApi;
