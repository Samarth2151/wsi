import { ArrowUpRight, Boxes, PackageCheck, Warehouse } from 'lucide-react';

const inventoryStates = [
  {
    code: 'FREE',
    label: 'Available',
    description: 'Ready to receive stock',
  },
  {
    code: 'OCCUPIED',
    label: 'Occupied',
    description: 'Stock currently stored',
  },
  {
    code: 'TRANSFER',
    label: 'In transfer',
    description: 'Moving between locations',
  },
];

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Warehouse home">
          <span className="brand-mark" aria-hidden="true">
            <Warehouse size={20} strokeWidth={2.2} />
          </span>
          <span className="brand-name">Northstar</span>
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-product">Warehouse</span>
        </a>
        <span className="workspace-label">Operations workspace</span>
      </header>

      <main className="main-content">
        <section className="welcome" aria-labelledby="page-title">
          <div className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            YOUR OPERATIONS, IN ONE PLACE
          </div>
          <h1 id="page-title">Warehouse Management System</h1>
          <p className="welcome-copy">
            A clear view of your inventory, storage locations, and stock
            movement starts here.
          </p>

          <div className="workspace-card">
            <div className="workspace-icon" aria-hidden="true">
              <Boxes size={22} />
            </div>
            <div className="workspace-message">
              <p className="workspace-title">Your workspace is ready</p>
              <p className="workspace-description">
                Inventory and warehouse activity will appear here as your
                operation gets underway.
              </p>
            </div>
            <ArrowUpRight
              className="workspace-arrow"
              size={19}
              aria-hidden="true"
            />
          </div>
        </section>

        <section className="status-section" aria-labelledby="status-heading">
          <div className="section-heading">
            <div>
              <p className="section-kicker">AT A GLANCE</p>
              <h2 id="status-heading">Inventory status</h2>
            </div>
            <PackageCheck size={21} aria-hidden="true" />
          </div>
          <div className="status-grid">
            {inventoryStates.map((state) => (
              <article
                className={`status-card status-card--${state.code.toLowerCase()}`}
                key={state.code}
              >
                <span className="status-indicator" aria-hidden="true" />
                <div>
                  <h3>{state.label}</h3>
                  <p>{state.description}</p>
                </div>
                <span className="status-code">{state.code}</span>
              </article>
            ))}
          </div>
        </section>

        <footer className="page-footer">
          Built for the people who keep things moving.
        </footer>
      </main>
    </div>
  );
}

export default App;
