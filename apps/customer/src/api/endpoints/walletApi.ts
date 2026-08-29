import { baseApi } from '../baseApi';

export type WalletBalance = {
    balance: string | number;
};

export type LedgerEntry = {
    id: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number | string;
    referenceType: string;
    referenceId: string;
    createdAt: string;
};

export type LedgerParams = {
    page?: number;
    size?: number;
    sort?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
};

export const walletApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getWalletBalance: builder.query<WalletBalance, void>({
            query: () => '/api/v1/wallet/balance',
            transformResponse: (response: any) => response.data,
            providesTags: ['WalletBalance'],
        }),

        getWalletLedger: builder.query<{ items: LedgerEntry[]; pagination: { totalElements: number; totalPages: number } }, LedgerParams | void>({
            query: (params) => ({
                url: '/api/v1/wallet/ledger',
                params: params || {},
            }),
            transformResponse: (response: any) => ({
                items: response.data,
                pagination: response.pagination,
            }),
        }),
    }),
});

export const { useGetWalletBalanceQuery, useGetWalletLedgerQuery } = walletApi;
