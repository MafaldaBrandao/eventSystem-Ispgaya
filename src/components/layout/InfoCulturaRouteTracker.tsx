import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { trackInfoCulturaView } from '../../api/public.js';
import { buildInfoCulturaMetricViewPayload } from '../../utils/infoCulturaMetrics.js';

function InfoCulturaRouteTracker() {
  const location = useLocation();
  const lastTrackedPath = useRef('');

  useEffect(() => {
    const pathname = location.pathname;
    if (pathname === lastTrackedPath.current) {
      return;
    }

    lastTrackedPath.current = pathname;
    const payload = buildInfoCulturaMetricViewPayload(pathname);
    if (!payload) return;

    void trackInfoCulturaView(payload);
  }, [location.pathname]);

  return null;
}

export default InfoCulturaRouteTracker;
