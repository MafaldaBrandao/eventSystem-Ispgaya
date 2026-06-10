import { useEffect, useMemo, useState } from 'react';
import { getLocaleText, useLocale } from '../../../i18n/locale';

import { searchUniversities } from '../../../api/public';
import { UniversitySearchResult } from '../../../api/types';

type UseUniversityEmailDomainOptions = {
  enabled: boolean;
  email: string;
  suggestedLocalPart?: string;
  autoApplySearchResult?: boolean;
  onEmailChange: (nextEmail: string) => void;
};

function getEmailDomain(value: string): string {
  const trimmed = value.trim();
  const atIndex = trimmed.lastIndexOf('@');
  return atIndex >= 0 ? trimmed.slice(atIndex + 1).toLowerCase() : '';
}

function applyEmailDomain(value: string, domain: string): string {
  const trimmed = value.trim();
  const normalizedDomain = domain.trim();

  if (!normalizedDomain) {
    return trimmed;
  }

  const localPart = trimmed.includes('@') ? trimmed.split('@', 1)[0].trim() : trimmed;
  if (!localPart) {
    return trimmed;
  }

  return `${localPart}@${normalizedDomain}`;
}

function buildSuggestedEmail(localPart: string, domain: string): string {
  const normalizedLocalPart = localPart.trim();
  const normalizedDomain = domain.trim();

  if (!normalizedLocalPart || !normalizedDomain) {
    return '';
  }

  return `${normalizedLocalPart}@${normalizedDomain}`;
}

function prioritizeIspgaya(universities: UniversitySearchResult[]): UniversitySearchResult[] {
  const score = (item: UniversitySearchResult) => {
    const name = item.name.toLowerCase();
    const domains = item.domains.map((domain) => domain.toLowerCase());

    if (name.includes('ispgaya')) return 0;
    if (domains.some((domain) => domain.includes('ispgaya.pt'))) return 0;
    if (name.includes('gaya')) return 1;
    return 2;
  };

  return [...universities].sort((a, b) => {
    const diff = score(a) - score(b);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name, 'pt-PT');
  });
}

export function useUniversityEmailDomain({
  enabled,
  email,
  suggestedLocalPart = '',
  autoApplySearchResult = true,
  onEmailChange,
}: UseUniversityEmailDomainOptions) {
  const { locale } = useLocale();
  const [universityQuery, setUniversityQuery] = useState('');
  const [universityCountry, setUniversityCountry] = useState('Portugal');
  const [universityResults, setUniversityResults] = useState<UniversitySearchResult[]>([]);
  const [selectedUniversityIndex, setSelectedUniversityIndex] = useState<number>(0);
  const [selectedUniversityDomain, setSelectedUniversityDomain] = useState('');
  const [isSearchingUniversities, setIsSearchingUniversities] = useState(false);
  const [universityError, setUniversityError] = useState('');

  const selectedUniversity = useMemo(
    () => universityResults[selectedUniversityIndex] || null,
    [selectedUniversityIndex, universityResults]
  );

  async function loadUniversities(query: string, country: string) {
    setIsSearchingUniversities(true);
    setUniversityError('');

    try {
      const currentEmail = email;
      const items = await searchUniversities({
        name: query,
        country,
        limit: 25,
      });

      const prioritizedItems = prioritizeIspgaya(items);
      const firstUniversity = prioritizedItems[0] || null;
      const nextDomain = firstUniversity?.domains[0] || '';

      setUniversityResults(prioritizedItems);
      setSelectedUniversityIndex(0);
      setSelectedUniversityDomain(nextDomain);

      if (nextDomain && autoApplySearchResult) {
        onEmailChange(
          currentEmail.trim()
            ? applyEmailDomain(currentEmail, nextDomain)
            : buildSuggestedEmail(suggestedLocalPart, nextDomain)
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : getLocaleText(locale, 'Nao foi possivel carregar as universidades.', 'Could not load the universities.');
      setUniversityError(message);
      setUniversityResults([]);
      setSelectedUniversityIndex(0);
      setSelectedUniversityDomain('');
    } finally {
      setIsSearchingUniversities(false);
    }
  }

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void loadUniversities('', universityCountry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, universityCountry]);

  useEffect(() => {
    if (!selectedUniversity) {
      setSelectedUniversityDomain('');
      return;
    }

    const currentEmailDomain = getEmailDomain(email);
    const nextDomain =
      (currentEmailDomain && selectedUniversity.domains.includes(currentEmailDomain)
        ? currentEmailDomain
        : '') || selectedUniversity.domains[0] || '';

    setSelectedUniversityDomain(nextDomain);
  }, [email, selectedUniversity?.name]);

  function handleSelectUniversity(index: number) {
    const university = universityResults[index];
    if (!university) return;

    setSelectedUniversityIndex(index);
    const nextDomain = university.domains[0] || '';
    setSelectedUniversityDomain(nextDomain);

    if (nextDomain) {
      onEmailChange(
        email.trim()
          ? applyEmailDomain(email, nextDomain)
          : buildSuggestedEmail(suggestedLocalPart, nextDomain)
      );
    }
  }

  function handleEmailChange(nextEmail: string) {
    onEmailChange(nextEmail);
  }

  function handleUniversityDomainChange(nextDomain: string) {
    setSelectedUniversityDomain(nextDomain);
    if (nextDomain) {
      onEmailChange(
        email.trim()
          ? applyEmailDomain(email, nextDomain)
          : buildSuggestedEmail(suggestedLocalPart, nextDomain)
      );
    }
  }

  return {
    universityQuery,
    setUniversityQuery,
    universityCountry,
    setUniversityCountry,
    universityResults,
    selectedUniversityIndex,
    selectedUniversityDomain,
    selectedUniversity,
    isSearchingUniversities,
    universityError,
    loadUniversities,
    handleSelectUniversity,
    handleEmailChange,
    handleUniversityDomainChange,
  };
}
