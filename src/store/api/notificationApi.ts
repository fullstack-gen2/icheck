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
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationApi;
