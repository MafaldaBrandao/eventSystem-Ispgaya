import { ComponentType, ReactNode } from 'react';

type AdminHeroTone = 'amber' | 'blue' | 'slate' | 'rose' | 'emerald';

type AdminHeroStat = {
  label: string;
  value: string | number;
};

type AdminPageHeroProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tone?: AdminHeroTone;
  stats?: AdminHeroStat[];
  actions?: ReactNode;
};

function getAdminHeroToneClasses(tone: AdminHeroTone): string {
  if (tone === 'blue') return 'bg-sky-100 text-sky-700';
  if (tone === 'rose') return 'bg-rose-100 text-rose-700';
  if (tone === 'emerald') return 'bg-emerald-100 text-emerald-700';
  if (tone === 'slate') return 'bg-slate-100 text-slate-700';
  return 'bg-amber-100 text-amber-700';
}

function AdminPageHero({
  icon: Icon,
  title,
  description,
  tone = 'amber',
  stats = [],
  actions,
}: AdminPageHeroProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${getAdminHeroToneClasses(
                tone
              )}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            </div>
          </div>
        </div>

        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>

      {stats.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
            >
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default AdminPageHero;
