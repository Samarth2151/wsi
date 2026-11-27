import { BatteryCharging, Bot } from 'lucide-react';

import { PageHeading } from '../components/PageHeading';

export function ShuttlePage() {
  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="FLEET MONITORING"
        title="Shuttle Status"
        description="Review shuttle availability and battery condition."
      />
      <section className="placeholder-panel" aria-labelledby="shuttle-panel-title">
        <div className="placeholder-icon" aria-hidden="true">
          <Bot size={25} />
        </div>
        <div>
          <p className="page-eyebrow">LIVE TELEMETRY</p>
          <h2 id="shuttle-panel-title">Shuttle data is ready to connect</h2>
          <p>Current status and battery information will appear here.</p>
        </div>
        <BatteryCharging className="panel-accent-icon" size={23} aria-hidden="true" />
      </section>
    </div>
  );
}
