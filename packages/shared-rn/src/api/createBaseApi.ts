import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
  type FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query/react';
import type { ApiEnvelope, UnwrappedApiError } from '../types/api';
import type { AccessToken, RefreshToken, TokenPair } from '../types/tokens';
import {
  performTokenRefresh,
  type RefreshSuccessPayload,
  type TokenRefreshCallbacks,
} from '../auth/tokenRefresh';
import { recordRequestId, captureNonFatalError } from '../utils/crashReporting';
import { logger } from '../utils/logger';

export type IdempotentMutationArg = {
  idempotencyKey?: string;
  [key: string]: unknown;
};

export type CreateBaseApiConfig<TagTypes extends string = string> = {
  /** Per-environment API origin, e.g. https://api.foodie.example.com */
  baseUrl: string;
  reducerPath?: string;
  /** Apps supply their tagTypes; shared factory does not invent feature tags. */
  tagTypes: readonly TagTypes[];
  getAccessToken: (state: unknown) => AccessToken | string | null | undefined;
  getRefreshToken: (state: unknown) => RefreshToken | string | null | undefined;
  onCredentialsRefreshed: (
    pair: TokenPair,
    raw?: RefreshSuccessPayload,
  ) => void;
  onTokenReuseDetected: () => void | Promise<void>;
  onRefreshFailed: (code: string) => void | Promise<void>;
  /**
   * Optional: skip refresh/retry for specific relative URLs (e.g. auth/refresh itself).
   */
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
 * Factory for each app's single RTK Query createApi instance.
 * Blueprint §7–§8, §13. Exactly one createApi per app — never a second.
 */
export function createBaseApi<TagTypes extends string = string>(
  config: CreateBaseApiConfig<TagTypes>,
) {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: config.baseUrl.replace(/\/$/, ''),
    prepareHeaders: (headers, { getState }) => {
      const token = config.getAccessToken(getState());
      if (token) {
        headers.set('Authorization', `Bearer ${String(token)}`);
      }
      headers.set('Accept', 'application/json');
      return headers;
    },
  });

  const refreshCallbacks: TokenRefreshCallbacks = {
    onCredentialsRefreshed: config.onCredentialsRefreshed,
    onTokenReuseDetected: config.onTokenReuseDetected,
    onRefreshFailed: config.onRefreshFailed,
  };

  const defaultIsRefreshEndpoint = (url: string) =>
    url.includes('/api/v1/auth/refresh');

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
      const errorMsg = ('error' in fetchError && typeof fetchError.error === 'string') ? fetchError.error : 'check your connection';
      const networkError: EnvelopeAwareError = {
        status: fetchError.status,
        data: {
          code: 'NETWORK_ERROR',
          message: `Network error: ${errorMsg}`,
          fields: null,
        },
      };
      logger.error('API network failure', {
        url: extractUrl(requestArgs),
        status: String(fetchError.status),
      });
      return { error: networkError, meta: result.meta };
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

      // TOKEN_REUSE_DETECTED — never retry (Blueprint §13.3)
      if (code === 'TOKEN_REUSE_DETECTED') {
        await config.onTokenReuseDetected();
        return {
          error: { status: unwrapped.status ?? 401, data: unwrapped },
          meta: result.meta,
        };
      }

      // Routine expired access token — coalesce refresh + single retry (§13.2)
      if (
        code === 'UNAUTHORIZED' &&
        !isRefreshEndpoint(extractUrl(requestArgs))
      ) {
        const refreshToken = config.getRefreshToken(api.getState());
        if (refreshToken) {
          const pair = await performTokenRefresh({
            baseUrl: config.baseUrl,
            refreshToken,
            callbacks: refreshCallbacks,
          });
          if (pair) {
            const retryResult = await rawBaseQuery(
              requestArgs,
              api,
              extraOptions ?? {},
            );
            if (retryResult.error) {
              const retryError = retryResult.error as FetchBaseQueryError;
              const errorMsg = ('error' in retryError && typeof retryError.error === 'string') ? retryError.error : 'check your connection';
              return {
                error: {
                  status: retryError.status,
                  data: {
                    code: 'NETWORK_ERROR',
                    message: `Network error: ${errorMsg}`,
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
                status: retryEnvelope?.meta ? 400 : 401,
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
      }

      return {
        error: { status: unwrapped.status ?? 400, data: unwrapped },
        meta: result.meta,
      };
    }

    // Non-envelope response (should not occur for Foodie API) — pass through
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
