import { baseApi } from '../baseApi';
import type { AuditLogsResponse } from '../../features/audit-log/types';

/**
 * Audit Logs RTK Query endpoints — P2-ADM-06.
 * Access restricted to SUPER_ADMIN.
 */
export const auditLogsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getAuditLogs: builder.query<
      AuditLogsResponse,
      {
        resourceType?: string;
        action?: string;
        resourceId?: string;
        adminUserId?: string;
        createdAtFrom?: string;
        createdAtTo?: string;
        page?: number;
        size?: number;
        sort?: string;
      }
    >({
      query: (params) => ({
        url: '/api/bff/admin/audit-logs',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map(({ id }) => ({ type: 'Admin' as const, id })),
              { type: 'Admin', id: 'AUDIT_LIST' },
            ]
          : [{ type: 'Admin', id: 'AUDIT_LIST' }],
      keepUnusedDataFor: 60,
    }),
  }),
});

export const { useGetAuditLogsQuery } = auditLogsApi;
