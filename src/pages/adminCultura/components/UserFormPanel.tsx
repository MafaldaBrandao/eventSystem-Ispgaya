import { Dispatch, FormEvent, SetStateAction } from 'react';
import { NavLink } from 'react-router-dom';
import { Users } from 'lucide-react';

import { InfoCulturaClub, InfoCulturaRole, InfoCulturaUser } from '../../../api/infoculturaApi.js';
import { useUniversityEmailDomain } from '../hooks/useUniversityEmailDomain.js';
import { adminNamePattern, adminNameTitle } from '../nameValidation.js';
import { UserPage, UserFormState } from '../types.js';
import {
  adminActions,
  adminBtnPrimary,
  adminBtnSecondary,
  adminError,
  adminField,
  adminInfo,
  adminInput,
  adminLabel,
  adminPanelCard,
  adminPanelForm,
} from '../../../styles/ui.js';
import AdminPageHero from './AdminPageHero.js';
import { getLocaleText, useLocale } from '../../../i18n/locale';

function buildEmailLocalPartFromName(name: string): string {
  const normalized = name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  return normalized || 'utilizador';
}

type UserFormPanelProps = {
  userPage: UserPage;
  canManageUsers: boolean;
  isLoadingUsers: boolean;
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
};

export default function UserFormPanel({
  userPage,
  canManageUsers,
  isLoadingUsers,
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
}: UserFormPanelProps) {
  const { locale } = useLocale();
  const university = useUniversityEmailDomain({
    enabled: userPage.mode === 'create',
    email: userForm.email,
    suggestedLocalPart: buildEmailLocalPartFromName(userForm.name),
    autoApplySearchResult: userPage.mode === 'create',
    onEmailChange: (nextEmail) =>
      setUserForm((current) => ({
        ...current,
        email: nextEmail,
      })),
  });

  return (
    <div className="space-y-6">
      <AdminPageHero
        icon={Users}
        title={userPage.mode === 'create' ? getLocaleText(locale, 'Criar Utilizador', 'Create User') : getLocaleText(locale, 'Editar Utilizador', 'Edit User')}
        description={
          userPage.mode === 'create'
            ? getLocaleText(locale, 'Criação de novos acessos administrativos no InfoCultura.', 'Create new administrative access in InfoCultura.')
            : getLocaleText(locale, 'Atualização dos dados e permissões do utilizador selecionado.', 'Update the selected user data and permissions.')
        }
        tone="slate"
        actions={
          <NavLink to="/infocultura/utilizadores" className={adminBtnSecondary}>
            {getLocaleText(locale, 'Voltar aos utilizadores', 'Back to users')}
          </NavLink>
        }
      />

      <section className={adminPanelCard}>
        {!canManageUsers ? (
          <p className={adminError}>{getLocaleText(locale, 'Apenas o superadmin pode aceder a esta pagina.', 'Only the superadmin can access this page.')}</p>
        ) : userPage.mode === 'edit' && !selectedUser ? (
          <p className={adminInfo}>
            {isLoadingUsers ? getLocaleText(locale, 'A carregar utilizador...', 'Loading user...') : getLocaleText(locale, 'Utilizador nao encontrado.', 'User not found.')}
          </p>
        ) : (
          <form onSubmit={handleSaveUser} className={adminPanelForm}>
            <div className="space-y-6">
              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {getLocaleText(locale, 'Dados pessoais', 'Personal data')}
                  </h3>
                  <p className={adminInfo}>{getLocaleText(locale, 'Nome e contacto institucional do novo utilizador.', 'Name and institutional contact details for the new user.')}</p>
                </div>

                <div className="space-y-4">
                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="user-name">
                      Nome
                    </label>
                    <input
                      id="user-name"
                      className={adminInput}
                      pattern={adminNamePattern}
                      title={adminNameTitle}
                      value={userForm.name}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </div>

                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="university-country">
                      {getLocaleText(locale, 'País', 'Country')}
                    </label>
                    <select
                      id="university-country"
                      className={adminInput}
                      value={university.universityCountry}
                      onChange={(event) => university.setUniversityCountry(event.target.value)}
                    >
                      <option value="Portugal">Portugal</option>
                      <option value="all">{getLocaleText(locale, 'Todos os países', 'All countries')}</option>
                    </select>
                  </div>

                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="university-search">
                      {getLocaleText(locale, 'Universidade', 'University')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="university-search"
                        className={adminInput}
                        value={university.universityQuery}
                        onChange={(event) => university.setUniversityQuery(event.target.value)}
                        placeholder={getLocaleText(locale, 'Pesquisar universidade', 'Search university')}
                      />
                      <button
                        type="button"
                        className={adminBtnSecondary}
                        onClick={() =>
                          void university.loadUniversities(
                            university.universityQuery,
                            university.universityCountry
                          )
                        }
                      >
                        {getLocaleText(locale, 'Pesquisar', 'Search')}
                      </button>
                    </div>
                    {university.universityError ? (
                      <p className={adminError}>{university.universityError}</p>
                    ) : null}
                    {university.isSearchingUniversities ? (
                      <p className={adminInfo}>{getLocaleText(locale, 'A procurar universidades...', 'Searching universities...')}</p>
                    ) : null}
                    {!university.isSearchingUniversities && university.universityResults.length > 0 ? (
                      <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div>
                          <label className={adminLabel} htmlFor="university-result">
                            {getLocaleText(locale, 'Resultados', 'Results')}
                          </label>
                          <select
                            id="university-result"
                            className={adminInput}
                            value={university.selectedUniversityIndex}
                            onChange={(event) =>
                              university.handleSelectUniversity(Number(event.target.value))
                            }
                          >
                            {university.universityResults.map((item, index) => (
                              <option key={`${item.name}-${item.country}-${index}`} value={index}>
                                {item.name} · {item.country}
                              </option>
                            ))}
                          </select>
                        </div>

                        {university.selectedUniversity ? (
                          <div className="space-y-2">
                            <p className={adminInfo}>
                              {getLocaleText(locale, 'Domínios disponíveis:', 'Available domains:')}{' '}
                              {university.selectedUniversity.domains.join(', ') || getLocaleText(locale, 'Sem domínio', 'No domain')}
                            </p>
                            {university.selectedUniversity.domains.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                <select
                                  className={adminInput}
                                  value={university.selectedUniversityDomain}
                                  onChange={(event) =>
                                    university.handleUniversityDomainChange(event.target.value)
                                  }
                                >
                                  {university.selectedUniversity.domains.map((domain) => (
                                    <option key={domain} value={domain}>
                                      {domain}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : null}
                            {university.selectedUniversityDomain ? (
                              <p className={adminInfo}>
                                {getLocaleText(locale, 'Domínio selecionado:', 'Selected domain:')} {university.selectedUniversityDomain}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="user-email">
                      Email
                    </label>
                    <input
                      id="user-email"
                      type="email"
                      className={adminInput}
                      value={userForm.email}
                      onChange={(event) => university.handleEmailChange(event.target.value)}
                    />
                    <p className={adminInfo}>
                      {getLocaleText(locale, 'O email institucional aparece automaticamente quando escolhes a universidade.', 'The institutional email appears automatically when you choose a university.')}
                    </p>
                    <p className={adminInfo}>
                      {getLocaleText(locale, 'O dominio substitui apenas a parte depois do @ e nao pode ser trocado manualmente.', 'The domain only replaces the part after @ and cannot be changed manually.')}
                    </p>
                  </div>
                </div>
              </section>

              {userPage.mode === 'create' || userPage.mode === 'edit' ? (
                <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {getLocaleText(locale, 'Clube', 'Club')}
                    </h3>
                    <p className={adminInfo}>
                      {userPage.mode === 'create'
                        ? getLocaleText(locale, 'Associa este utilizador a um clube logo na criação.', 'Associate this user with a club during creation.')
                        : getLocaleText(locale, 'Atualiza o clube associado a este utilizador.', 'Update the club associated with this user.')}
                    </p>
                  </div>

                  <div className={adminField}>
                    <label className={adminLabel} htmlFor="user-club">
                      {getLocaleText(locale, 'Clube', 'Club')}
                    </label>
                    <select
                      id="user-club"
                      className={adminInput}
                      value={userForm.club_id}
                      required={userPage.mode === 'create'}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, club_id: event.target.value }))
                      }
                    >
                      <option value="">
                        {userPage.mode === 'create' ? getLocaleText(locale, 'Seleciona um clube', 'Select a club') : getLocaleText(locale, 'Sem clube', 'No club')}
                      </option>
                      {isLoadingClubs ? <option value="">{getLocaleText(locale, 'A carregar clubes...', 'Loading clubs...')}</option> : null}
                      {!isLoadingClubs && clubs.length === 0 ? (
                        <option value="">{getLocaleText(locale, 'Nao existem clubes disponiveis', 'No clubs available')}</option>
                      ) : null}
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                    <p className={adminInfo}>
                      {userPage.mode === 'create'
                        ? getLocaleText(locale, 'O clube escolhido fica guardado no momento da criacao do utilizador.', 'The selected club is saved when the user is created.')
                        : getLocaleText(locale, 'Podes trocar ou remover a associação do clube nesta edição.', 'You can change or remove the club association in this edit.')}
                    </p>
                  </div>
                </section>
              ) : null}

              <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {getLocaleText(locale, 'Acesso', 'Access')}
                  </h3>
                  <p className={adminInfo}>
                    {getLocaleText(locale, 'Define o perfil administrativo que este utilizador vai receber.', 'Define the administrative profile this user will receive.')}
                  </p>
                </div>

                <div className={adminField}>
                  <label className={adminLabel} htmlFor="user-role">
                    {getLocaleText(locale, 'Função', 'Role')}
                  </label>
                  <select
                    id="user-role"
                    className={adminInput}
                    value={userForm.role}
                    onChange={(event) =>
                      setUserForm((prev) => ({ ...prev, role: event.target.value }))
                    }
                  >
                    {isLoadingRoles ? <option>{getLocaleText(locale, 'A carregar roles...', 'Loading roles...')}</option> : null}
                    {!isLoadingRoles && roles.length === 0 ? (
                      <option value="">{getLocaleText(locale, 'Sem roles disponiveis', 'No roles available')}</option>
                    ) : null}
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </section>
            </div>

            {userFormError ? <p className={adminError}>{userFormError}</p> : null}

            <div className={adminActions}>
              <button
                type="submit"
                className={adminBtnPrimary}
                disabled={isSavingUser || isLoadingRoles || roles.length === 0}
              >
                {isSavingUser
                  ? getLocaleText(locale, 'A guardar...', 'Saving...')
                  : userPage.mode === 'create'
                    ? getLocaleText(locale, 'Criar utilizador', 'Create user')
                    : getLocaleText(locale, 'Guardar alteracoes', 'Save changes')}
              </button>
              <button type="button" onClick={() => resetUserForm()} className={adminBtnSecondary}>
                {getLocaleText(locale, 'Limpar', 'Reset')}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
