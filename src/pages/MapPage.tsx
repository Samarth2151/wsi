import { ArrowRight, Boxes, Map } from 'lucide-react';

import { PageHeading } from '../components/PageHeading';

export function MapPage() {
  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="WAREHOUSE OVERVIEW"
        title="Warehouse Map"
        description="See storage locations and stock movement across your floor."
      />

      <section className="map-placeholder" aria-labelledby="map-preview-title">
        <div className="placeholder-icon" aria-hidden="true">
          <Map size={25} />
        </div>
        <p className="page-eyebrow">LOCATION VIEW</p>
        <h2 id="map-preview-title">Your warehouse floor at a glance</h2>
        <p>
          The live 5 × 5 location map will appear here when warehouse data is
          connected.
        </p>
        <div className="map-facts" role="group" aria-label="Warehouse layout facts">
          <span><Boxes size={16} aria-hidden="true" /> 24 storage slots</span>
          <span><ArrowRight size={16} aria-hidden="true" /> A1 transfer point</span>
        </div>
      </section>
    </div>
  );
}
