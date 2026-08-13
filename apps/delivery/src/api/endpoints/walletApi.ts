import { baseApi } from '../baseApi';
import type {
  LedgerEntry,
  LedgerQueryParams,
  PayoutRequestResult,
  RequestPayoutArg,
  WalletBalance,
} from '../../features/wallet/types';
import {
  DEFAULT_LEDGER_PAGE_SIZE,
  isLedgerSort,
  normalizeLedgerList,
} from '../../features/wallet/types';

/**
 * Wallet RTK — P2-DEL-04 (UI-API Wallet/Ledger/Payout + §9.1–§9.3).
 * No GET payout history (GAP-API-11).
 */
export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWalletBalance: builder.query<WalletBalance, void>({
      query: () => '/api/v1/wallet/balance',
      providesTags: [{ type: 'Wallet', id: 'BALANCE' }],
      keepUnusedDataFor: 0,
    }),
    getWalletLedger: builder.query<LedgerEntry[], LedgerQueryParams>({
      query: ({
        page = 0,
        size = DEFAULT_LEDGER_PAGE_SIZE,
        sort = 'createdAt',
        createdAtFrom,
        createdAtTo,
      }) => ({
        url: '/api/v1/wallet/ledger',
        params: {
          page,
          size: Math.min(size, 100),
          sort: isLedgerSort(sort) ? sort : 'createdAt',
          ...(createdAtFrom ? { createdAtFrom } : {}),
          ...(createdAtTo ? { createdAtTo } : {}),
        },
      }),
      transformResponse: (response: unknown) => normalizeLedgerList(response),
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ ledgerEntryId }) => ({
              type: 'Wallet' as const,
              id: `LEDGER-${ledgerEntryId}`,
            })),
            { type: 'Wallet', id: 'LIST' },
          ]
          : [{ type: 'Wallet', id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),
    requestPayout: builder.mutation<PayoutRequestResult, RequestPayoutArg>({
      query: ({ amount, accountHolderName, accountNumber, ifscCode, bankName, idempotencyKey }) => ({
        url: '/api/v1/wallet/payout-requests',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: { amount, accountHolderName, accountNumber, ifscCode, bankName },
      }),
      invalidatesTags: [
        { type: 'Wallet', id: 'BALANCE' },
        { type: 'Wallet', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetWalletBalanceQuery,
  useGetWalletLedgerQuery,
  useRequestPayoutMutation,
} = walletApi;
