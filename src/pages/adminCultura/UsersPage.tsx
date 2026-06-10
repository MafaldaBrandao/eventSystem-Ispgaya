import { Dispatch, FormEvent, SetStateAction } from 'react';
import { NavLink } from 'react-router-dom';
import { Users } from 'lucide-react';

import AdminPageHero from './components/AdminPageHero.js';
import { UserPage, UserFormState } from './types';
import { formatAdminDateTime } from './utils';
import {
  adminActions,
  adminBtnDanger,
  adminBtnEdit,
  adminBtnPrimary,
  adminBtnSecondary,
  adminError,
  adminField,
  adminFormGridSpaced,
  adminInfo,
  adminInput,
  adminLabel,
  adminListTools,
  adminPanelCard,
  adminPanelForm,
  adminUserEmail,
  adminUserItem,
  adminUserList,
  adminUserMeta,
  adminUserName,
  adminUserStatus,
  adminUserStatusActive,
  adminUserStatusInactive,
} from '../../styles/ui';
import { InfoCulturaClub, InfoCulturaRole, InfoCulturaUser } from '../../api/infoculturaApi';
import UserFormPanel from './components/UserFormPanel.js';
import { getLocaleText, useLocale } from '../../i18n/locale';

type AdminHeroStat = { label: string; value: string | number };

type UsersPageProps = {
  userPage: UserPage | null;
  canManageUsers: boolean;
  userOverviewStats: AdminHeroStat[];
  isLoadingUsers: boolean;
  filteredUsers: InfoCulturaUser[];
  currentUser: InfoCulturaUser | null;
  userDateFrom: string;
  userDateTo: string;
  userOrder: string;
  setUserDateFrom: Dispatch<SetStateAction<string>>;
  setUserDateTo: Dispatch<SetStateAction<string>>;
  setUserOrder: Dispatch<SetStateAction<string>>;
  isSavingUser: boolean;
  isLoadingRoles: boolean;
  clubs: InfoCulturaClub[];
  isLoadingClubs: boolean;
  roles: InfoCulturaRole[];
  userForm: UserFormState;
  setUserForm: Dispatch<SetStateAction<UserFormState>>;
  userFormError: string;
  handleSaveUser: (event: FormEvent<HTMLFormElement>) => void;
  resetUserForm: () => void;
  selectedUser: InfoCulturaUser | null;
  isDeactivatingUser: boolean;
  handleDeactivateUser: (event: FormEvent<HTMLFormElement>) => void;
  isActivatingUser: boolean;
  handleActivateUser: (event: FormEvent<HTMLFormElement>) => void;
};

function UsersPage({
  userPage,
  canManageUsers,
  userOverviewStats,
  isLoadingUsers,
  filteredUsers,
  currentUser,
  userDateFrom,
  userDateTo,
  userOrder,
  setUserDateFrom,
  setUserDateTo,
  setUserOrder,
  isSavingUser,
  isLoadingRoles,
  clubs,
  isLoadingClubs,
  roles,
  userForm,
  setUserForm,
  userFormError,
  handleSaveUser,
  resetUserForm,
  selectedUser,
  isDeactivatingUser,
  handleDeactivateUser,
  isActivatingUser,
  handleActivateUser,
}: UsersPageProps) {
  const { locale } = useLocale();

  if (!userPage) return null;

  if (userPage.mode === 'list') {
    return (
      <div className="space-y-6">
        <AdminPageHero
          icon={Users}
        title={getLocaleText(locale, 'Utilizadores', 'Users')}
        description={getLocaleText(locale, 'Gestão e consulta dos acessos administrativos do InfoCultura.', 'Management and review of InfoCultura administrative access.')}
        tone="slate"
        stats={userOverviewStats}
        actions={
          canManageUsers ? (
            <>
              <NavLink to="/infocultura/utilizadores/novo" className={adminBtnPrimary}>
                {getLocaleText(locale, 'Criar utilizador', 'Create user')}
              </NavLink>
            </>
          ) : undefined
        }
      />

        <section className={adminPanelCard}>
          <div className={adminFormGridSpaced}>
            <div className={adminField}>
              <label className={adminLabel} htmlFor="user-date-from">
                {getLocaleText(locale, 'Criados desde', 'Created from')}
              </label>
              <input
                id="user-date-from"
                type="date"
                className={adminInput}
                value={userDateFrom}
                onChange={(event) => setUserDateFrom(event.target.value)}
              />
            </div>
            <div className={adminField}>
              <label className={adminLabel} htmlFor="user-date-to">
                {getLocaleText(locale, 'Criados até', 'Created until')}
              </label>
              <input
                id="user-date-to"
                type="date"
                className={adminInput}
                value={userDateTo}
                onChange={(event) => setUserDateTo(event.target.value)}
              />
            </div>
            <div className={adminField}>
              <label className={adminLabel} htmlFor="user-order">
                {getLocaleText(locale, 'Sortear por', 'Sort by')}
              </label>
              <select
                id="user-order"
                className={adminInput}
                value={userOrder}
                onChange={(event) => setUserOrder(event.target.value)}
              >
                <option value="active_name">{getLocaleText(locale, 'Ativos primeiro', 'Active first')}</option>
                <option value="newest">{getLocaleText(locale, 'Mais recentes', 'Newest')}</option>
                <option value="oldest">{getLocaleText(locale, 'Mais antigos', 'Oldest')}</option>
                <option value="name_asc">{getLocaleText(locale, 'Nome A-Z', 'Name A-Z')}</option>
                <option value="name_desc">{getLocaleText(locale, 'Nome Z-A', 'Name Z-A')}</option>
                <option value="email_asc">{getLocaleText(locale, 'Email A-Z', 'Email A-Z')}</option>
                <option value="email_desc">{getLocaleText(locale, 'Email Z-A', 'Email Z-A')}</option>
              </select>
            </div>
          </div>

          {canManageUsers ? null : (
            <p className={adminInfo}>
              {getLocaleText(locale, 'Apenas o superadmin pode criar, editar e desativar utilizadores.', 'Only the superadmin can create, edit and deactivate users.')}
            </p>
          )}

          <div className={adminUserList}>
            {isLoadingUsers ? <p className={adminInfo}>{getLocaleText(locale, 'A carregar utilizadores...', 'Loading users...')}</p> : null}
            {!isLoadingUsers && filteredUsers.length === 0 ? (
              <p className={adminInfo}>{getLocaleText(locale, 'Não existem utilizadores para mostrar.', 'There are no users to display.')}</p>
            ) : null}
            {filteredUsers.map((user) => (
              <article key={user.id} className={adminUserItem}>
                <div>
                  <h3 className={adminUserName}>{user.name}</h3>
                  <p className={adminUserEmail}>{user.email}</p>
                  <p className={adminUserMeta}>
                    {user.role}
                    {currentUser?.id === user.id ? getLocaleText(locale, ' · sessão atual', ' · current session') : ''}
                  </p>
                  <p className={adminUserMeta}>
                    {getLocaleText(locale, 'Criado em:', 'Created at:')} {formatAdminDateTime(user.created_at || '')}
                  </p>
                </div>
                <div className={adminListTools}>
                  <span
                    className={`${adminUserStatus} ${
                      user.is_active ? adminUserStatusActive : adminUserStatusInactive
                    }`}
                  >
                    {user.is_active ? getLocaleText(locale, 'Ativo', 'Active') : getLocaleText(locale, 'Inativo', 'Inactive')}
                  </span>
                  <NavLink
                    to={`/infocultura/utilizadores/${user.id}/perfil`}
                    className={adminBtnSecondary}
                  >
                    {getLocaleText(locale, 'Perfil', 'Profile')}
                  </NavLink>
                  {canManageUsers ? (
                    <>
                      <NavLink
                        to={`/infocultura/utilizadores/${user.id}/editar`}
                        className={adminBtnEdit}
                      >
                        {getLocaleText(locale, 'Editar', 'Edit')}
                      </NavLink>
                      {user.is_active && currentUser?.id !== user.id ? (
                        <NavLink
                          to={`/infocultura/utilizadores/${user.id}/desativar`}
                          className={adminBtnDanger}
                        >
                          {getLocaleText(locale, 'Desativar', 'Deactivate')}
                        </NavLink>
                      ) : null}
                      {!user.is_active ? (
                        <NavLink
                          to={`/infocultura/utilizadores/${user.id}/ativar`}
                          className={adminBtnPrimary}
                        >
                          {getLocaleText(locale, 'Ativar', 'Activate')}
                        </NavLink>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (userPage.mode === 'profile') {
    return (
      <div className="space-y-6">
        <AdminPageHero
          icon={Users}
          title={getLocaleText(locale, 'Perfil de Utilizador', 'User Profile')}
          description={getLocaleText(locale, 'Detalhe completo do acesso e da filiação do utilizador no InfoCultura.', 'Complete details of the user access and club affiliation in InfoCultura.')}
          tone="blue"
          actions={
            <NavLink to="/infocultura/utilizadores" className={adminBtnSecondary}>
              {getLocaleText(locale, 'Voltar aos utilizadores', 'Back to users')}
            </NavLink>
          }
        />

        <section className={adminPanelCard}>
          {!selectedUser ? (
            <p className={adminInfo}>
              {isLoadingUsers ? getLocaleText(locale, 'A carregar utilizador...', 'Loading user...') : getLocaleText(locale, 'Utilizador não encontrado.', 'User not found.')}
            </p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className={adminUserName}>{selectedUser.name}</h3>
                  <p className={adminUserEmail}>{selectedUser.email}</p>
                  <p className={adminUserMeta}>
                    {selectedUser.role}
                    {currentUser?.id === selectedUser.id ? getLocaleText(locale, ' · sessão atual', ' · current session') : ''}
                  </p>
                </div>
                <span
                  className={`${adminUserStatus} ${
                    selectedUser.is_active ? adminUserStatusActive : adminUserStatusInactive
                  }`}
                >
                  {selectedUser.is_active ? getLocaleText(locale, 'Ativo', 'Active') : getLocaleText(locale, 'Inativo', 'Inactive')}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Email
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{selectedUser.email}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {getLocaleText(locale, 'Função', 'Role')}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">{selectedUser.role}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Clube
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {selectedUser.club_name || getLocaleText(locale, 'Sem clube associado', 'No club assigned')}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {getLocaleText(locale, 'Estado', 'Status')}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {selectedUser.is_active ? getLocaleText(locale, 'Conta ativa', 'Active account') : getLocaleText(locale, 'Conta inativa', 'Inactive account')}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {getLocaleText(locale, 'Criado em', 'Created at')}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatAdminDateTime(selectedUser.created_at || '')}
                  </p>
                </div>
              </div>

              {canManageUsers ? (
                <div className="flex flex-wrap gap-3">
                  <NavLink
                    to={`/infocultura/utilizadores/${selectedUser.id}/editar`}
                    className={adminBtnEdit}
                  >
                    {getLocaleText(locale, 'Editar utilizador', 'Edit user')}
                  </NavLink>
                  {selectedUser.is_active && currentUser?.id !== selectedUser.id ? (
                    <NavLink
                      to={`/infocultura/utilizadores/${selectedUser.id}/desativar`}
                      className={adminBtnDanger}
                    >
                      {getLocaleText(locale, 'Desativar', 'Deactivate')}
                    </NavLink>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    );
  }

  if (userPage.mode === 'create' || userPage.mode === 'edit') {
    return (
      <UserFormPanel
        userPage={userPage}
        canManageUsers={canManageUsers}
        isLoadingUsers={isLoadingUsers}
        isSavingUser={isSavingUser}
        isLoadingRoles={isLoadingRoles}
        clubs={clubs}
        isLoadingClubs={isLoadingClubs}
        roles={roles}
        userForm={userForm}
        setUserForm={setUserForm}
        userFormError={userFormError}
        handleSaveUser={handleSaveUser}
        resetUserForm={resetUserForm}
        selectedUser={selectedUser}
      />
    );
  }

  if (userPage.mode === 'deactivate') {
    return (
      <div className="space-y-6">
        <AdminPageHero
          icon={Users}
          title={getLocaleText(locale, 'Desativar Utilizador', 'Deactivate User')}
          description={getLocaleText(locale, 'Confirma a desativação do utilizador selecionado antes de remover o acesso.', 'Confirm deactivation of the selected user before removing access.')}
          tone="rose"
          actions={
            <NavLink to="/infocultura/utilizadores" className={adminBtnSecondary}>
              {getLocaleText(locale, 'Voltar aos utilizadores', 'Back to users')}
            </NavLink>
          }
        />

        <section className={adminPanelCard}>
          {!canManageUsers ? (
            <p className={adminError}>{getLocaleText(locale, 'Apenas o superadmin pode aceder a esta pagina.', 'Only the superadmin can access this page.')}</p>
          ) : !selectedUser ? (
            <p className={adminInfo}>
              {isLoadingUsers ? getLocaleText(locale, 'A carregar utilizador...', 'Loading user...') : getLocaleText(locale, 'Utilizador não encontrado.', 'User not found.')}
            </p>
          ) : (
            <form onSubmit={handleDeactivateUser} className={adminPanelForm}>
              <div className={adminUserItem}>
                <div>
                  <h3 className={adminUserName}>{selectedUser.name}</h3>
                  <p className={adminUserEmail}>{selectedUser.email}</p>
                  <p className={adminUserMeta}>{selectedUser.role}</p>
                </div>
                <span
                  className={`${adminUserStatus} ${
                    selectedUser.is_active
                      ? adminUserStatusActive
                      : adminUserStatusInactive
                  }`}
                >
                  {selectedUser.is_active ? getLocaleText(locale, 'Ativo', 'Active') : getLocaleText(locale, 'Inativo', 'Inactive')}
                </span>
              </div>

              {userFormError ? <p className={adminError}>{userFormError}</p> : null}

              <div className={adminActions}>
                <button
                  type="submit"
                  className={adminBtnDanger}
                  disabled={isDeactivatingUser || !selectedUser.is_active}
                >
                  {isDeactivatingUser ? getLocaleText(locale, 'A desativar...', 'Deactivating...') : getLocaleText(locale, 'Confirmar desativação', 'Confirm deactivation')}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    );
  }

  if (userPage.mode === 'activate') {
    return (
      <div className="space-y-6">
        <AdminPageHero
          icon={Users}
          title={getLocaleText(locale, 'Ativar Utilizador', 'Activate User')}
          description={getLocaleText(locale, 'Confirma a ativação do utilizador selecionado para restaurar o acesso.', 'Confirm activation of the selected user to restore access.')}
          tone="emerald"
          actions={
            <NavLink to="/infocultura/utilizadores" className={adminBtnSecondary}>
              {getLocaleText(locale, 'Voltar aos utilizadores', 'Back to users')}
            </NavLink>
          }
        />

        <section className={adminPanelCard}>
          {!canManageUsers ? (
            <p className={adminError}>{getLocaleText(locale, 'Apenas o superadmin pode aceder a esta pagina.', 'Only the superadmin can access this page.')}</p>
          ) : !selectedUser ? (
            <p className={adminInfo}>
              {isLoadingUsers ? getLocaleText(locale, 'A carregar utilizador...', 'Loading user...') : getLocaleText(locale, 'Utilizador não encontrado.', 'User not found.')}
            </p>
          ) : (
            <form onSubmit={handleActivateUser} className={adminPanelForm}>
              <div className={adminUserItem}>
                <div>
                  <h3 className={adminUserName}>{selectedUser.name}</h3>
                  <p className={adminUserEmail}>{selectedUser.email}</p>
                  <p className={adminUserMeta}>{selectedUser.role}</p>
                </div>
                <span
                  className={`${adminUserStatus} ${
                    selectedUser.is_active
                      ? adminUserStatusActive
                      : adminUserStatusInactive
                  }`}
                >
                  {selectedUser.is_active ? getLocaleText(locale, 'Ativo', 'Active') : getLocaleText(locale, 'Inativo', 'Inactive')}
                </span>
              </div>

              {userFormError ? <p className={adminError}>{userFormError}</p> : null}

              <div className={adminActions}>
                <button
                  type="submit"
                  className={adminBtnPrimary}
                  disabled={isActivatingUser || selectedUser.is_active}
                >
                  {isActivatingUser ? getLocaleText(locale, 'A ativar...', 'Activating...') : getLocaleText(locale, 'Confirmar ativação', 'Confirm activation')}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    );
  }

  return null;
}

export default UsersPage;
