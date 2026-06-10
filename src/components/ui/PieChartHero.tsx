import type { CSSProperties } from 'react';
import {
  pieChartWrap,
  pieCircle,
  pieLegend,
  pieLegendDot,
  pieLegendItem,
  pieSubtitle,
  pieTitle
} from '../../styles/ui';

const legendItems = [
  { label: 'Artigos Cientificos', color: '#1f77b4' },
  { label: 'Capitulos', color: '#ff7f0e' },
  { label: 'Livros', color: '#2ca02c' },
  { label: 'Artigos em atas', color: '#9467bd' }
];

const pieStyle: CSSProperties = {
  background:
    'conic-gradient(#1f77b4 0deg 170deg, #ff7f0e 170deg 260deg, #2ca02c 260deg 300deg, #9467bd 300deg 360deg)'
};

function PieChartHero() {
  return (
    <div className={pieChartWrap}>
      <h3 className={pieTitle}>Distribuicao das Publicacoes</h3>
      <p className={pieSubtitle}>Publicacoes Cientificas por tipo</p>
      <div className={pieCircle} style={pieStyle} aria-label="Distribuicao de publicacoes" />
      <div className={pieLegend}>
        {legendItems.map((item) => (
          <div key={item.label} className={pieLegendItem}>
            <span className={pieLegendDot} style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PieChartHero;
