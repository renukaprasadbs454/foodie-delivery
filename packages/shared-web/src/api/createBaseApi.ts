import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query/react';
import type { ApiEnvelope, UnwrappedApiError } from '../types/api';
import { performAdminTokenRefresh } from '../auth/tokenRefresh';
import { recordRequestId, captureNonFatalError } from '../utils/crashReporting';
import { logger } from '../utils/logger';

export type IdempotentMutationArg = {
  idempotencyKey?: string;
  [key: string]: unknown;
};

/**
 * Admin createBaseApi config — Blueprint §7.4.
 * baseUrl points at Next.js BFF `/api/*`, not the backend directly.
 * Tokens never enter client JS; cookies travel via credentials: 'include'.
 */
export type CreateBaseApiConfig<TagTypes extends string = string> = {
  /** Typically `''` or same-origin; requests go to `/api/...` BFF routes. */
  baseUrl: string;
  reducerPath?: string;
  tagTypes: readonly TagTypes[];
  /** BFF refresh path — default `/api/auth/refresh`. */
  refreshPath?: string;
  onSessionRefreshed?: () => void | Promise<void>;
  onTokenReuseDetected: () => void | Promise<void>;
  onRefreshFailed: (code: string) => void | Promise<void>;
  isRefreshEndpoint?: (url: string) => boolean;
};

type EnvelopeAwareError = {
  status: number | string;
  data: UnwrappedApiError;
};

function extractUrl(args: string | FetchArgs): string {
  return typeof args === 'string' ? args : args.url;
}

function attachIdempotencyHeader(
  args: string | FetchArgs,
): string | FetchArgs {
  if (typeof args === 'string') return args;
  const maybeKey = (args.body as IdempotentMutationArg | undefined)
    ?.idempotencyKey;
  if (!maybeKey) return args;
  return {
    ...args,
    headers: {
      ...(args.headers as Record<string, string> | undefined),
      'Idempotency-Key': maybeKey,
    },
  };
}

/**
 * Factory for Admin's single RTK Query createApi instance.
 * Blueprint §7–§8, §7.4. Exactly one createApi per app — never a second.
 */
export function createBaseApi<TagTypes extends string = string>(
  config: CreateBaseApiConfig<TagTypes>,
) {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: config.baseUrl.replace(/\/$/, ''),
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('Accept', 'application/json');
      return headers;
    },
  });

  const refreshPath = config.refreshPath ?? '/api/auth/refresh';
  const defaultIsRefreshEndpoint = (url: string) =>
    url.includes('/api/auth/refresh') ||
    url.includes('/auth/refresh') ||
    url.includes('/api/auth/login') ||
    url.includes('/auth/login');
  const isRefreshEndpoint =
    config.isRefreshEndpoint ?? defaultIsRefreshEndpoint;

  const baseQueryWithEnvelopeAndReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    EnvelopeAwareError,
    object,
    FetchBaseQueryMeta
  > = async (args, api, extraOptions) => {
    const requestArgs = attachIdempotencyHeader(args);
    const result = await rawBaseQuery(requestArgs, api, extraOptions ?? {});

    if (result.error) {
      const fetchError = result.error as FetchBaseQueryError;
      logger.error('API network failure', {
        url: extractUrl(requestArgs),
        status: String(fetchError.status),
      });
      return {
        error: {
          status: fetchError.status,
          data: {
            code: 'NETWORK_ERROR',
            message: 'check your connection',
            fields: null,
          },
        },
        meta: result.meta,
      };
    }

    const envelope = result.data as ApiEnvelope<unknown>;
    const requestId = envelope?.meta?.requestId;
    recordRequestId(requestId);

    if (envelope && typeof envelope.success === 'boolean') {
      if (envelope.success) {
        logger.info('API success', { requestId, url: extractUrl(requestArgs) });
        return { data: envelope.data, meta: result.meta };
      }

      const code = envelope.error?.code ?? 'INTERNAL_ERROR';
      const unwrapped: UnwrappedApiError = {
        code,
        message: envelope.error?.message ?? 'Something went wrong',
        fields: envelope.error?.fields ?? null,
        status:
          typeof result.meta?.response?.status === 'number'
            ? result.meta.response.status
            : undefined,
        requestId,
      };

      if (code === 'INTERNAL_ERROR') {
        captureNonFatalError(new Error(`INTERNAL_ERROR: ${unwrapped.message}`), {
          recentRequestIds: requestId ? [requestId] : undefined,
        });
      }

      logger.error('API application error', {
        requestId,
        code,
        url: extractUrl(requestArgs),
      });

      if (code === 'TOKEN_REUSE_DETECTED') {
        await config.onTokenReuseDetected();
        return {
          error: { status: unwrapped.status ?? 401, data: unwrapped },
          meta: result.meta,
        };
      }

      if (
        code === 'UNAUTHORIZED' &&
        !isRefreshEndpoint(extractUrl(requestArgs))
      ) {
        const refreshed = await performAdminTokenRefresh({
          refreshPath,
          callbacks: {
            onRefreshed: async () => {
              await config.onSessionRefreshed?.();
            },
            onTokenReuseDetected: config.onTokenReuseDetected,
            onRefreshFailed: config.onRefreshFailed,
          },
        });

        if (refreshed) {
          const retryResult = await rawBaseQuery(
            requestArgs,
            api,
            extraOptions ?? {},
          );
          if (retryResult.error) {
            return {
              error: {
                status: (retryResult.error as FetchBaseQueryError).status,
                data: {
                  code: 'NETWORK_ERROR',
                  message: 'check your connection',
                  fields: null,
                },
              },
              meta: retryResult.meta,
            };
          }
          const retryEnvelope = retryResult.data as ApiEnvelope<unknown>;
          recordRequestId(retryEnvelope?.meta?.requestId);
          if (retryEnvelope?.success) {
            return { data: retryEnvelope.data, meta: retryResult.meta };
          }
          const retryCode = retryEnvelope?.error?.code ?? 'INTERNAL_ERROR';
          return {
            error: {
              status: 400,
              data: {
                code: retryCode,
                message:
                  retryEnvelope?.error?.message ?? 'Something went wrong',
                fields: retryEnvelope?.error?.fields ?? null,
                requestId: retryEnvelope?.meta?.requestId,
              },
            },
            meta: retryResult.meta,
          };
        }
      }

      return {
        error: { status: unwrapped.status ?? 400, data: unwrapped },
        meta: result.meta,
      };
    }

    return { data: result.data, meta: result.meta };
  };

  return createApi({
    reducerPath: config.reducerPath ?? 'api',
    baseQuery: baseQueryWithEnvelopeAndReauth,
    tagTypes: [...config.tagTypes],
    endpoints: () => ({}),
    refetchOnReconnect: true,
    refetchOnFocus: false,
  });
}

export type FoodieBaseApi = ReturnType<typeof createBaseApi>;
