import { BarChart3, ClipboardCheck } from 'lucide-react';

import { PageHeading } from '../components/PageHeading';

export function AuditorPage() {
  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="AUDIT & UTILIZATION"
        title="Auditor Dashboard"
        description="Track occupancy trends and review current warehouse stock."
      />
      <section className="placeholder-panel" aria-labelledby="auditor-panel-title">
        <div className="placeholder-icon" aria-hidden="true">
          <BarChart3 size={25} />
        </div>
        <div>
          <p className="page-eyebrow">SEVEN-DAY VIEW</p>
          <h2 id="auditor-panel-title">Occupancy insights will appear here</h2>
          <p>Daily storage history and pallet records are ready to connect.</p>
        </div>
        <ClipboardCheck className="panel-accent-icon" size={23} aria-hidden="true" />
      </section>
    </div>
  );
}
