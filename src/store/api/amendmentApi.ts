import { baseApi, unwrapContent, type ApiEnvelope, type PagePayload } from "@/store/api/baseApi";

/** Mirrors AmendmentMapper.AmendmentResponse on the backend. */
export interface AmendmentDto {
  id: number;
  requestTypeName: string | null;
  requestedBy: string | null;
  sessionId: number | null;
  attendanceId: number | null;
  reason: string | null;
  status: string | null;
  remark: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  createdAt: string | null;
  leaveTime: string | null;
}

export type AmendmentDecision = "APPROVED" | "REJECTED";

export interface ReviewAmendmentRequest {
  amendmentId: number;
  decision: AmendmentDecision;
  reviewerId: number;
  remark?: string;
}

export const amendmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** All PENDING amendments awaiting admin review (newest first from backend). */
    getPendingAmendments: builder.query<AmendmentDto[], { size?: number } | void>({
      query: (arg) => `/amendments/pending?page=0&size=${arg?.size ?? 100}`,
      transformResponse: (response: ApiEnvelope<PagePayload<AmendmentDto> | AmendmentDto[]>) =>
        unwrapContent<AmendmentDto>(response),
      providesTags: ["Amendment"],
    }),
    /** Approve or reject an amendment. Backend updates attendance status on
     *  approval and notifies the requesting student of the decision. */
    reviewAmendment: builder.mutation<unknown, ReviewAmendmentRequest>({
      query: ({ amendmentId, decision, reviewerId, remark }) => ({
        url: `/amendments/${amendmentId}/review`,
        method: "POST",
        body: { decision, reviewerId, remark: remark ?? "" },
      }),
      // Refresh the pending list and the bell (notifications reuse "Setting").
      invalidatesTags: ["Amendment", "Setting"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPendingAmendmentsQuery,
  useReviewAmendmentMutation,
} = amendmentApi;
