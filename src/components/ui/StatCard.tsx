import { statCard, statLabel, statValue } from '../../styles/ui';

type StatCardProps = {
  value: number;
  label: string;
};

function StatCard({ value, label }: StatCardProps) {
  return (
    <article className={statCard}>
      <p className={statValue}>{value}</p>
      <p className={statLabel}>{label}</p>
    </article>
  );
}

export default StatCard;
