import { Download } from 'lucide-react';
import {
  docBadge,
  docDownloadAction,
  docDownloadIcon,
  docMain,
  docMeta,
  docName,
  docRow,
  docTop
} from '../../styles/ui';
import { useLocale, getLocaleText } from '../../i18n/locale.js';

type DocumentRowProps = {
  name: string;
  meta: string;
  href: string;
};

function DocumentRow({ name, meta, href }: DocumentRowProps) {
  const { locale } = useLocale();
  return (
    <article className={docRow}>
      <span className={docBadge}>PDF</span>

      <div className={docMain}>
        <div className={docTop}>
          <h3 className={docName}>{name}</h3>
        </div>
        <p className={docMeta}>{meta}</p>
      </div>

      <a
        href={href}
        className={docDownloadAction}
        aria-label={getLocaleText(locale, `Descarregar ${name}`, `Download ${name}`)}
      >
        <Download className={docDownloadIcon} />
      </a>
    </article>
  );
}

export default DocumentRow;
