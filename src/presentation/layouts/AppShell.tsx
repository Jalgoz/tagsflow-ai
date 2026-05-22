import { NavLink, Outlet } from 'react-router-dom'
import { APP_NAV_ITEMS, APP_ROUTE_PATHS } from '../../shared/constants/routes'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'app-shell__nav-link',
    isActive ? 'app-shell__nav-link--active' : '',
  ]
    .filter(Boolean)
    .join(' ')

export const AppShell = () => {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <div className="app-shell__brand">
          <div className="app-shell__brand-mark">TF</div>
          <div>
            <div className="app-shell__brand-name">TagsFlow AI</div>
            <div className="app-shell__brand-subtitle">Project foundation</div>
          </div>
        </div>

        <nav className="app-shell__nav" aria-label="Primary navigation">
          {APP_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={navLinkClassName}
              end={item.path !== APP_ROUTE_PATHS.projects}
            >
              <span>{item.label}</span>
              <span className="app-shell__nav-path">{item.shortPath}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-shell__sidebar-footer">
          <div className="app-shell__status-chip">MVP slice</div>
          <p className="app-shell__sidebar-note">
            Routed shell with local project, member, and tag modules.
          </p>
        </div>
      </aside>

      <div className="app-shell__main">
        <header className="app-shell__header">
          <div>
            <p className="app-shell__eyebrow">Frontend architecture</p>
            <h1 className="app-shell__title">Workspace shell</h1>
          </div>
          <div className="app-shell__header-meta">
            <span className="app-shell__header-pill">Local-first ready</span>
            <span className="app-shell__header-pill">Light/dark prepared</span>
          </div>
        </header>

        <main className="app-shell__content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
