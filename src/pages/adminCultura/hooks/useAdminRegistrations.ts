import { useCallback, useEffect, useRef } from 'react';

import {
  InfoCulturaRegistration,
  InfoCulturaRegistrationStatus,
  fetchAdminRegistrations,
  fetchAdminRegistrationStatuses,
} from '../../../api/infoculturaApi';

type UseAdminRegistrationsOptions = {
  token: string;
  currentUser: unknown;
  activeSection: string | null;
  canManageUsers: boolean;
  registrationClubFilter: string;
  registrationStatusFilter: string;
  registrationSearch: string;
  registrationOrder: string;
  registrationDateFrom: string;
  registrationDateTo: string;
  registrationPage: number;
  setIsLoadingRegistrations: (value: boolean) => void;
  setIsLoadingRegistrationStatuses: (value: boolean) => void;
  setRegistrationStatuses: (value: InfoCulturaRegistrationStatus[]) => void;
  setRegistrations: (value: InfoCulturaRegistration[]) => void;
  setRegistrationTotal: (value: number) => void;
  setRegistrationTotalPages: (value: number) => void;
  setRegistrationError: (value: string) => void;
  handleAuthError: (error: unknown) => boolean;
  pageSize: number;
};

export function useAdminRegistrations({
  token,
  currentUser,
  activeSection,
  canManageUsers,
  registrationClubFilter,
  registrationStatusFilter,
  registrationSearch,
  registrationOrder,
  registrationDateFrom,
  registrationDateTo,
  registrationPage,
  setIsLoadingRegistrations,
  setIsLoadingRegistrationStatuses,
  setRegistrationStatuses,
  setRegistrations,
  setRegistrationTotal,
  setRegistrationTotalPages,
  setRegistrationError,
  handleAuthError,
  pageSize,
}: UseAdminRegistrationsOptions) {
  const isFetchingRef = useRef(false);

  const loadRegistrations = useCallback(
    async ({ showLoading }: { showLoading: boolean }) => {
      if (!token || !currentUser || activeSection !== 'inscricoes' || isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;

      if (showLoading) {
        setIsLoadingRegistrationStatuses(true);
        setIsLoadingRegistrations(true);
      }

      setRegistrationError('');

      const clubId =
        canManageUsers && registrationClubFilter !== 'all'
          ? Number(registrationClubFilter)
          : undefined;
      const status =
        registrationStatusFilter && registrationStatusFilter !== 'all'
          ? registrationStatusFilter
          : undefined;

      try {
        const [nextStatuses, registrationPageData] = await Promise.all([
          fetchAdminRegistrationStatuses(token),
          fetchAdminRegistrations(token, {
            clubId,
            status,
            search: registrationSearch,
            ordering: registrationOrder,
            dateFrom: registrationDateFrom,
            dateTo: registrationDateTo,
            page: registrationPage,
            pageSize,
          }),
        ]);

        setRegistrationStatuses(nextStatuses);
        setRegistrations(registrationPageData.items);
        setRegistrationTotal(registrationPageData.total);
        setRegistrationTotalPages(registrationPageData.total_pages);
      } catch (error) {
        if (handleAuthError(error)) return;
        const message =
          error instanceof Error ? error.message : 'Nao foi possivel carregar as inscricoes.';
        setRegistrationError(message);
      } finally {
        isFetchingRef.current = false;

        if (showLoading) {
          setIsLoadingRegistrationStatuses(false);
          setIsLoadingRegistrations(false);
        }
      }
    },
    [
      activeSection,
      token,
      currentUser,
      canManageUsers,
      registrationClubFilter,
      registrationStatusFilter,
      registrationSearch,
      registrationOrder,
      registrationDateFrom,
      registrationDateTo,
      registrationPage,
      pageSize,
      setIsLoadingRegistrationStatuses,
      setIsLoadingRegistrations,
      setRegistrationError,
      setRegistrationStatuses,
      setRegistrations,
      setRegistrationTotal,
      setRegistrationTotalPages,
      handleAuthError,
    ]
  );

  useEffect(() => {
    if (!token || !currentUser || activeSection !== 'inscricoes') {
      return;
    }

    void loadRegistrations({ showLoading: true });
  }, [loadRegistrations, activeSection, token, currentUser]);

  useEffect(() => {
    if (!token || !currentUser || activeSection !== 'inscricoes') {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadRegistrations({ showLoading: false });
    }, 5000);

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void loadRegistrations({ showLoading: false });
      }
    }

    function handleFocus() {
      void loadRegistrations({ showLoading: false });
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadRegistrations, activeSection, token, currentUser]);
}
