import { baseApi } from '../baseApi';
import type { CustomerAddress } from '../../features/checkout/types';
import type { AddAddressRequest } from '../../features/profile/types';

/**
 * Addresses RTK — P2-CUS-04 list; P2-CUS-07 add/remove (no update endpoint — Gap).
 */
export const addressesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAddresses: builder.query<CustomerAddress[], void>({
      query: () => '/api/v1/users/me/addresses',
      transformResponse: (response: unknown) => {
        if (Array.isArray(response)) return response as CustomerAddress[];
        return [];
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ addressId }) => ({
                type: 'Address' as const,
                id: addressId,
              })),
              { type: 'Address', id: 'LIST' },
            ]
          : [{ type: 'Address', id: 'LIST' }],
      keepUnusedDataFor: 120,
    }),
    addAddress: builder.mutation<CustomerAddress, AddAddressRequest>({
      query: (body) => ({
        url: '/api/v1/users/me/addresses',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'Address', id: 'LIST' }],
    }),
    removeAddress: builder.mutation<null, string>({
      query: (addressId) => ({
        url: `/api/v1/users/me/addresses/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, addressId) => [
        { type: 'Address', id: addressId },
        { type: 'Address', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useAddAddressMutation,
  useRemoveAddressMutation,
} = addressesApi;
