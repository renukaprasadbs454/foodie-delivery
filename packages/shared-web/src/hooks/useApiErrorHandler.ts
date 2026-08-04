import { useCallback } from 'react';
import {
  mapErrorCode,
  type ErrorMappingEntry,
  type ErrorUiTreatment,
} from '../api/errorMapping';
import type { UnwrappedApiError } from '../types/api';

export type ApiErrorHandlerHandlers = {
  onInlineField?: (error: UnwrappedApiError, mapping: ErrorMappingEntry) => void;
  onToast?: (error: UnwrappedApiError, mapping: ErrorMappingEntry) => void;
  onFullScreen?: (error: UnwrappedApiError, mapping: ErrorMappingEntry) => void;
  onModalBlocking?: (
    error: UnwrappedApiError,
    mapping: ErrorMappingEntry,
  ) => void;
  onForceLogout?: (
    error: UnwrappedApiError,
    mapping: ErrorMappingEntry,
  ) => void;
  onGeneric?: (error: UnwrappedApiError, mapping: ErrorMappingEntry) => void;
};

const TREATMENT_HANDLER: Record<
  ErrorUiTreatment,
  keyof ApiErrorHandlerHandlers
> = {
  INLINE_FIELD: 'onInlineField',
  TOAST: 'onToast',
  FULL_SCREEN: 'onFullScreen',
  MODAL_BLOCKING: 'onModalBlocking',
  FORCE_LOGOUT: 'onForceLogout',
  GENERIC: 'onGeneric',
};

export function useApiErrorHandler(handlers: ApiErrorHandlerHandlers) {
  return useCallback(
    (error: UnwrappedApiError | null | undefined) => {
      if (!error?.code) return;
      const mapping = mapErrorCode(error.code);
      const key = TREATMENT_HANDLER[mapping.treatment];
      const handler = handlers[key] ?? handlers.onGeneric;
      handler?.(error, mapping);
    },
    [handlers],
  );
}
