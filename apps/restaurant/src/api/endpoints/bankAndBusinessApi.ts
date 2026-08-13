import { baseApi } from '../baseApi';
import type {
  BankAccountDetails,
  BusinessContactDetails,
  TaxAndLegalDetails,
  UpiDetails,
} from '../../features/profile/bankBusinessTypes';

export const bankAndBusinessApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBankDetails: builder.query<
      { bankAccount: BankAccountDetails; upi: UpiDetails },
      void
    >({
      query: () => '/api/v1/restaurants/me/bank-details',
      providesTags: [{ type: 'Restaurant', id: 'BANK_DETAILS' }],
      keepUnusedDataFor: 120,
    }),
    updateBankDetails: builder.mutation<
      { bankAccount: BankAccountDetails; upi: UpiDetails },
      Partial<BankAccountDetails & UpiDetails>
    >({
      query: (body) => ({
        url: '/api/v1/restaurants/me/bank-details',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'Restaurant', id: 'BANK_DETAILS' }],
    }),
    getBusinessDetails: builder.query<
      { taxAndLegal: TaxAndLegalDetails; businessContact: BusinessContactDetails },
      void
    >({
      query: () => '/api/v1/restaurants/me/business-details',
      providesTags: [{ type: 'Restaurant', id: 'BUSINESS_DETAILS' }],
      keepUnusedDataFor: 120,
    }),
    updateBusinessDetails: builder.mutation<
      { taxAndLegal: TaxAndLegalDetails; businessContact: BusinessContactDetails },
      Partial<TaxAndLegalDetails & BusinessContactDetails>
    >({
      query: (body) => ({
        url: '/api/v1/restaurants/me/business-details',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'Restaurant', id: 'BUSINESS_DETAILS' }],
    }),
    verifyBankDetails: builder.mutation<
      { status: 'VERIFIED' | 'PENDING'; message: string },
      void
    >({
      query: () => ({
        url: '/api/v1/restaurants/me/bank-details/verify',
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Restaurant', id: 'BANK_DETAILS' }],
    }),
    verifyUpi: builder.mutation<
      { status: 'VERIFIED' | 'PENDING'; message: string },
      { upiId: string }
    >({
      query: (body) => ({
        url: '/api/v1/restaurants/me/upi/verify',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'Restaurant', id: 'BANK_DETAILS' }],
    }),
  }),
});

export const {
  useGetBankDetailsQuery,
  useUpdateBankDetailsMutation,
  useGetBusinessDetailsQuery,
  useUpdateBusinessDetailsMutation,
  useVerifyBankDetailsMutation,
  useVerifyUpiMutation,
} = bankAndBusinessApi;
