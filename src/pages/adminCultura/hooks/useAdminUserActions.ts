import { FormEvent, type Dispatch, type SetStateAction, useCallback } from 'react';
import type { NavigateFunction } from 'react-router-dom';

import {
  activateAdminUser,
  createAdminUser,
  deactivateAdminUser,
  InfoCulturaUser,
  updateAdminUser,
} from '../../../api/infoculturaApi';
import { getLocaleText, useLocale } from '../../../i18n/locale';
import { UserFormState, UserPage } from '../types';
import { sortUsers } from '../utils';

type UseAdminUserActionsOptions = {
  token: string;
  canManageUsers: boolean;
  userPage: UserPage | null;
  userForm: UserFormState;
  selectedUser: InfoCulturaUser | null;
  currentUser: InfoCulturaUser | null;
  setUsers: Dispatch<SetStateAction<InfoCulturaUser[]>>;
  setCurrentUser: Dispatch<SetStateAction<InfoCulturaUser | null>>;
  setUserFormError: (value: string) => void;
  setIsSavingUser: (value: boolean) => void;
  setIsDeactivatingUser: (value: boolean) => void;
  setIsActivatingUser: (value: boolean) => void;
  resetUserForm: () => void;
  navigate: NavigateFunction;
};

export function useAdminUserActions({
  token,
  canManageUsers,
  userPage,
  userForm,
  selectedUser,
  currentUser,
  setUsers,
  setCurrentUser,
  setUserFormError,
  setIsSavingUser,
  setIsDeactivatingUser,
  setIsActivatingUser,
  resetUserForm,
  navigate,
}: UseAdminUserActionsOptions) {
  const { locale } = useLocale();
  const handleSaveUser = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!token || !canManageUsers || !userPage) return;

      const manualPassword = userForm.password.trim();
      const clubId = userForm.club_id.trim() ? Number(userForm.club_id) : null;
      const payload = {
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        generate_password: userForm.generate_password,
        ...(userPage.mode === 'create' || userPage.mode === 'edit'
          ? { club_id: clubId }
          : {}),
        ...(!userForm.generate_password && manualPassword ? { password: manualPassword } : {}),
      };

      if (!payload.name || !payload.email || !payload.role) {
        setUserFormError(getLocaleText(locale, 'Preenche nome, email e role.', 'Fill in name, email and role.'));
        return;
      }

      if (userPage.mode === 'create' && !userForm.club_id) {
        setUserFormError(getLocaleText(locale, 'Seleciona um clube para associar este utilizador.', 'Select a club to associate with this user.'));
        return;
      }

      if (userPage.mode === 'create' && !userForm.generate_password && !manualPassword) {
        setUserFormError(getLocaleText(locale, 'Ativa a geração automatica ou indica uma password.', 'Enable automatic generation or provide a password.'));
        return;
      }

      setIsSavingUser(true);
      setUserFormError('');

      try {
        const savedUser =
          userPage.mode === 'create'
            ? await createAdminUser(token, payload)
            : userPage.mode === 'edit'
              ? await updateAdminUser(token, userPage.userId, payload)
              : null;

        if (!savedUser) {
          return;
        }

        setUsers((prev) =>
          userPage.mode === 'create'
            ? sortUsers([savedUser, ...prev])
            : sortUsers(prev.map((user) => (user.id === savedUser.id ? savedUser : user)))
        );

        if (currentUser?.id === savedUser.id) {
          setCurrentUser(savedUser);
        }

        resetUserForm();
        navigate('/infocultura/utilizadores');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : getLocaleText(locale, 'Não foi possível guardar o utilizador.', 'Could not save the user.');
        setUserFormError(message);
      } finally {
        setIsSavingUser(false);
      }
    },
    [
      token,
      canManageUsers,
      userPage,
      userForm,
      setUserFormError,
      setIsSavingUser,
      setUsers,
      currentUser,
      setCurrentUser,
      resetUserForm,
      navigate,
      locale,
    ]
  );

  const handleDeactivateUser = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!token || !canManageUsers || !selectedUser) return;

      setIsDeactivatingUser(true);
      setUserFormError('');

      try {
        const updatedUser = await deactivateAdminUser(token, selectedUser.id);
        setUsers((prev) =>
          sortUsers(prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
        );
        navigate('/infocultura/utilizadores');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : getLocaleText(locale, 'Não foi possível desativar o utilizador.', 'Could not deactivate the user.');
        setUserFormError(message);
      } finally {
        setIsDeactivatingUser(false);
      }
    },
    [
      token,
      canManageUsers,
      selectedUser,
      setIsDeactivatingUser,
      setUserFormError,
      setUsers,
      navigate,
      locale,
    ]
  );

  const handleActivateUser = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!token || !canManageUsers || !selectedUser) return;

      setIsActivatingUser(true);
      setUserFormError('');

      try {
        const updatedUser = await activateAdminUser(token, selectedUser.id);
        setUsers((prev) =>
          sortUsers(prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)))
        );
        navigate('/infocultura/utilizadores');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : getLocaleText(locale, 'Não foi possível ativar o utilizador.', 'Could not activate the user.');
        setUserFormError(message);
      } finally {
        setIsActivatingUser(false);
      }
    },
    [
      token,
      canManageUsers,
      selectedUser,
      setIsActivatingUser,
      setUserFormError,
      setUsers,
      navigate,
      locale,
    ]
  );

  return {
    handleSaveUser,
    handleDeactivateUser,
    handleActivateUser,
  };
}
