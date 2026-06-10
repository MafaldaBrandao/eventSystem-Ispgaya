import { getLocaleText } from '../../i18n/locale.js';

export type ClubCallToActionProps = {
  locale: 'pt' | 'en';
  enabled: boolean;
  onClick: () => void;
  statusText?: string;
};

function ClubCallToAction({ locale, enabled, onClick, statusText }: ClubCallToActionProps) {
  return (
    <section
      className="w-full bg-orange-50 py-20"
      style={{
        backgroundImage: "url('/images/stripes-pattern.svg')",
        backgroundPosition: 'top',
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto'
      }}
    >
      <div className="relative mx-auto w-full max-w-[92rem] px-4 sm:px-6 xl:px-8 z-10">
        <div className="text-center">
          <h3 className="font-bold tracking-tight font-serif mx-auto text-3xl lg:text-4xl text-slate-900">
            {getLocaleText(locale, 'Nunca pares de aprender', 'Never stop learning')}
          </h3>
          <div className="mt-3 mx-auto max-w-5xl text-lg text-slate-700 text-center">
            <p>
              {getLocaleText(
                locale,
                'Vem fazer parte da próxima geração de empreendedores e líderes, junta-te a nós!',
                'Come be part of the next generation of entrepreneurs and leaders, join us!'
              )}
            </p>
            <p>
              {getLocaleText(
                locale,
                'Vive uma experiência desafiante, enriquecedora e motivadora.',
                'Live a challenging, enriching and motivating experience.'
              )}
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            className="group inline-flex items-center px-7 py-5 bg-orange-700 text-white text-xl font-medium rounded-sm shadow-lg transition ease-in-out duration-200 hover:shadow-xl hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-400"
            disabled={!enabled}
            onClick={onClick}
          >
            {getLocaleText(locale, 'Inscrever-me neste clube', 'Join this club')}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mt-1 ml-4 h-7 w-7 transition-transform ease-in-out duration-200 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
          <p className="mt-2 text-sm text-slate-600">
            {statusText ||
              (enabled
                ? getLocaleText(
                    locale,
                    'O pedido será enviado para validação da equipa do clube.',
                    'The request will be sent to the club team for validation.'
                  )
                : getLocaleText(
                    locale,
                    'As inscrições deste clube estão encerradas neste momento.',
                    'Registrations for this club are currently closed.'
                  ))}
          </p>
        </div>
      </div>
    </section>
  );
}

export default ClubCallToAction;
