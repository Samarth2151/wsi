import { Shield, Users } from 'lucide-react';

import { PageHeading } from '../components/PageHeading';

export function AdminUsersPage() {
  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="User Management"
        description="Manage access and roles for your warehouse team."
      />
      <section className="placeholder-panel" aria-labelledby="users-panel-title">
        <div className="placeholder-icon" aria-hidden="true">
          <Users size={25} />
        </div>
        <div>
          <p className="page-eyebrow">TEAM ACCESS</p>
          <h2 id="users-panel-title">User tools are ready to connect</h2>
          <p>Account and role management will appear here.</p>
        </div>
        <Shield className="panel-accent-icon" size={23} aria-hidden="true" />
      </section>
    </div>
  );
}
