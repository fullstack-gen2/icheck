import { baseApi, unwrapContent, type ApiEnvelope } from "@/store/api/baseApi";

export interface ProgramTypeDto {
  id: number;
  name: string;
  code: string;
  structureType: string | null;
  defaultSessionsPerDay: number | null;
  allowMultipleSessions: boolean | null;
  description: string | null;
  status: boolean | null;
}

export const programTypeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProgramTypes: builder.query<ProgramTypeDto[], void>({
      query: () => "/program-types",
      transformResponse: (response: ApiEnvelope<ProgramTypeDto[]> | ProgramTypeDto[]) =>
        unwrapContent<ProgramTypeDto>(response),
    }),
  }),
  overrideExisting: false,
});

export const { useGetProgramTypesQuery } = programTypeApi;
