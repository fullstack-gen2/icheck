import { baseApi, unwrapContent, unwrapPayload, type ApiEnvelope, type PagePayload } from "@/store/api/baseApi";

export interface ClassroomDto {
  id: number;
  className: string;
  classCode: string;
  programTypeName: string;
  programTypeCode?: string | null;
  programTypeStructureType?: string | null;
  generation: number;
  year: number | null;
  semester: number | null;
  shift: string;
  academicYear?: number;
  startDate?: string;
  endDate?: string;
  /** Lab/room name, e.g. "Lab DevOps", "Lab AI", "Lab Data Analytics". */
  lab?: string | null;
  telegramChatId?: string | null;
  telegramAlertEnabled?: boolean | null;
  status: boolean;
}

/** Matches backend `ClassroomRequest` — used as the create/update body. */
export interface ClassroomRequestBody {
  className: string;
  classCode: string;
  programTypeId: number;
  generation: number;
  year: number | null;
  semester: number | null;
  shift: string | null;
  academicYear: number;
  startDate: string;
  endDate: string;
  telegramChatId?: string | null;
  telegramAlertEnabled?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  lab?: string | null;
  status: boolean;
}

export interface TelegramSettingsDto {
  classroomId: number;
  className: string;
  telegramChatId: string | null;
  telegramAlertEnabled: boolean;
}

export interface TelegramTestResponse {
  success: boolean;
  message: string;
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
    createClassroom: builder.mutation<ClassroomDto, ClassroomRequestBody>({
      query: (body) => ({
        url: "/classrooms",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<ClassroomDto>) => unwrapPayload(response),
      invalidatesTags: ["Classroom"],
    }),
    updateClassroom: builder.mutation<ClassroomDto, { id: number; body: ClassroomRequestBody }>({
      query: ({ id, body }) => ({
        url: `/classrooms/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (response: ApiEnvelope<ClassroomDto>) => unwrapPayload(response),
      invalidatesTags: ["Classroom"],
    }),
    getClassroomTelegram: builder.query<TelegramSettingsDto, number>({
      query: (id) => `/classrooms/${id}/telegram`,
      transformResponse: (response: ApiEnvelope<TelegramSettingsDto>) => unwrapPayload(response),
      providesTags: (_result, _error, id) => [{ type: "Classroom", id }],
    }),
    updateClassroomTelegram: builder.mutation<
      TelegramSettingsDto,
      { id: number; body: Pick<TelegramSettingsDto, "telegramChatId" | "telegramAlertEnabled"> }
    >({
      query: ({ id, body }) => ({
        url: `/classrooms/${id}/telegram`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<TelegramSettingsDto>) => unwrapPayload(response),
      invalidatesTags: (_result, _error, { id }) => ["Classroom", { type: "Classroom", id }],
    }),
    testClassroomTelegram: builder.mutation<
      TelegramTestResponse,
      { id: number; body: Pick<TelegramSettingsDto, "telegramChatId" | "telegramAlertEnabled"> }
    >({
      query: ({ id, body }) => ({
        url: `/classrooms/${id}/telegram/test`,
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<TelegramTestResponse>) => unwrapPayload(response),
    }),
    clearClassroomTelegram: builder.mutation<TelegramSettingsDto, number>({
      query: (id) => ({
        url: `/classrooms/${id}/telegram`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiEnvelope<TelegramSettingsDto>) => unwrapPayload(response),
      invalidatesTags: (_result, _error, id) => ["Classroom", { type: "Classroom", id }],
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
    /** Rule 16 — admin creates a brand-new setting key (e.g. first-time IP allowlist / school location). */
    createSetting: builder.mutation<
      SettingDto,
      { key: string; value: string; type: "INT" | "BOOLEAN" | "STRING"; description?: string }
    >({
      query: (body) => ({
        url: "/settings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Setting"],
    }),
    /**
     * Create-or-update helper: tries PATCH first (setting already exists), and
     * falls back to POST /settings if the key hasn't been created yet.
     */
    upsertSetting: builder.mutation<
      SettingDto,
      { key: string; value: string; type: "INT" | "BOOLEAN" | "STRING"; description?: string }
    >({
      async queryFn({ key, value, type, description }, _api, _extra, baseQuery) {
        const patchResult = await baseQuery({
          url: `/settings/${encodeURIComponent(key)}`,
          method: "PATCH",
          body: { value },
        });
        if (!patchResult.error) {
          return { data: (patchResult.data as ApiEnvelope<SettingDto>)?.payload as SettingDto };
        }
        const status = (patchResult.error as { status?: number }).status;
        if (status === 404) {
          const createResult = await baseQuery({
            url: "/settings",
            method: "POST",
            body: { key, value, type, description },
          });
          if (!createResult.error) {
            return { data: (createResult.data as ApiEnvelope<SettingDto>)?.payload as SettingDto };
          }
          return { error: createResult.error as never };
        }
        return { error: patchResult.error as never };
      },
      invalidatesTags: ["Setting"],
    }),
    deleteSetting: builder.mutation<void, string>({
      query: (key) => ({
        url: `/settings/${encodeURIComponent(key)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Setting"],
    }),
    getStudentsByClassroom: builder.query<
      { id: number; name: string; studentNo?: string }[],
      { classroomId: number; size?: number }
    >({
      query: ({ classroomId, size = 500 }) => `/classrooms/${classroomId}/students?size=${size}`,
      transformResponse: (
        response: ApiEnvelope<PagePayload<{ id: number; name: string; studentNo?: string }> | { id: number; name: string; studentNo?: string }[]>
      ) => unwrapContent(response),
      providesTags: ["Student"],
    }),
    /**
     * Live attendance status for a session as `{ [studentId]: status }`.
     * Polled by the take-attendance list as a fallback to the STOMP stream so
     * the teacher still sees rows flip even when the WebSocket can't connect
     * (e.g. a proxy that strips the Upgrade header).
     */
    getSessionAttendanceStatus: builder.query<Record<string, string>, number>({
      query: (sessionId) => `/attendances/sessions/${sessionId}?size=500`,
      transformResponse: (
        response: ApiEnvelope<
          | PagePayload<{ student?: { id?: number }; studentId?: number; status?: string }>
          | { student?: { id?: number }; studentId?: number; status?: string }[]
        >,
      ) => {
        const rows = unwrapContent<{ student?: { id?: number }; studentId?: number; status?: string }>(response);
        const map: Record<string, string> = {};
        for (const row of rows) {
          const id = row?.student?.id ?? row?.studentId;
          if (id != null && typeof row.status === "string") {
            map[String(id)] = row.status.toLowerCase();
          }
        }
        return map;
      },
    }),
  }),
});

export const {
  useCreateClassroomMutation,
  useGetClassroomsQuery,
  useGetSettingsQuery,
  useGetClassroomTelegramQuery,
  useGetStudentsByClassroomQuery,
  useTestClassroomTelegramMutation,
  useUpdateClassroomTelegramMutation,
  useClearClassroomTelegramMutation,
  useUpdateClassroomMutation,
  useUpdateSettingMutation,
  useCreateSettingMutation,
  useUpsertSettingMutation,
  useDeleteSettingMutation,
  useGetSessionAttendanceStatusQuery,
} = attendanceApi;
