import { baseApi, unwrapContent, type ApiEnvelope, type PagePayload } from "@/store/api/baseApi";

export interface NotificationDto {
  id: number;
  message: string;
  type?: string;
  status?: "READ" | "UNREAD" | string;
  createdAt?: string;
  classroomId?: number | null;
  userId?: number | null;
}

/** Enriched row for the admin "all notifications" view (recipient + class). */
export interface NotificationAdminDto {
  id: number;
  message: string;
  type?: string | null;
  status?: string | null;
  createdAt?: string | null;
  userId?: number | null;
  userName?: string | null;
  role?: string | null;
  classroomId?: number | null;
  className?: string | null;
  classCode?: string | null;
  generation?: number | null;
  programType?: string | null;
}

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Notifications for the signed-in user, newest first by createdAt. The
     *  backend returns a `Page<Notification>` envelope — unwrap to a flat
     *  array. Bell badge + dropdown both feed off this query. */
    getNotifications: builder.query<NotificationDto[], number | string>({
      query: (userId) => `/notifications/users/${userId}?size=50`,
      transformResponse: (response: ApiEnvelope<PagePayload<NotificationDto> | NotificationDto[]>) =>
        unwrapContent<NotificationDto>(response),
      providesTags: ["Setting"],   // reuse an existing tag — invalidates on read/mark-all
    }),
    markNotificationRead: builder.mutation<void, number>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Setting"],
    }),
    markAllNotificationsRead: builder.mutation<void, number | string>({
      query: (userId) => ({ url: `/notifications/users/${userId}/read-all`, method: "PATCH" }),
      invalidatesTags: ["Setting"],
    }),
    /** Admin — ALL notifications enriched with recipient + class info. */
    getAllNotifications: builder.query<NotificationAdminDto[], { size?: number } | void>({
      query: (arg) => `/notifications?size=${arg?.size ?? 300}`,
      transformResponse: (response: ApiEnvelope<PagePayload<NotificationAdminDto> | NotificationAdminDto[]>) =>
        unwrapContent<NotificationAdminDto>(response),
      providesTags: ["Setting"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetAllNotificationsQuery,
} = notificationApi;
