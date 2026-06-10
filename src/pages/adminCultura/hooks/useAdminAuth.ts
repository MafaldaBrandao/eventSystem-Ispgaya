import { FormEvent } from 'react';

import { loginInfoCultura, logoutInfoCultura } from '../../../api/infoculturaApi';
import { TOKEN_KEY } from '../constants';
import { pushToast } from '../../../utils/toast.js';

type UseAdminAuthOptions = {
  authUser: string;
  authPass: string;
  setAuthUser: (value: string) => void;
  setAuthPass: (value: string) => void;
  setAuthError: (value: string) => void;
  setToken: (value: string) => void;
  clearDomainState: () => void;
};

export function useAdminAuth({
  authUser,
  authPass,
  setAuthUser,
  setAuthPass,
  setAuthError,
  setToken,
  clearDomainState,
}: UseAdminAuthOptions) {
  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError('');

    try {
      const nextToken = await loginInfoCultura(authUser, authPass);
      setToken(nextToken);
      sessionStorage.setItem(TOKEN_KEY, nextToken);
      setAuthPass('');
      setAuthUser('');
      pushToast({
        title: 'Sessão iniciada',
        message: 'O acesso ao painel foi autenticado com sucesso.',
        tone: 'success'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Credenciais invalidas.';
      setAuthError(message);
    }
  }

  function handleLogout() {
    void logoutInfoCultura();
    clearDomainState();
    setAuthUser('');
    setAuthPass('');
    pushToast({
      title: 'Sessão terminada',
      message: 'A sessão foi encerrada com sucesso.',
      tone: 'info'
    });
  }

  return {
    handleLogin,
    handleLogout,
  };
}
