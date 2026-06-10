import { getLocaleText, useLocale } from '../i18n/locale.js';
import ClubeCultural from './ClubeCultural';

function TunaAcademica() {
  const { locale } = useLocale();

  return (
    <ClubeCultural
      pageTitle={getLocaleText(locale, 'Tuna Académica', 'Academic Tuna')}
      pageDescription={getLocaleText(
        locale,
        'Página pública da Tuna Académica com notícias, eventos, sessões e atividades do clube.',
        'Public page for the Academic Tuna with news, events, sessions and club activities.'
      )}
      routePath="/laboratorio-cultural/tuna"
      clubSearchTerms={['tuna']}
    />
  );
}

export default TunaAcademica;
