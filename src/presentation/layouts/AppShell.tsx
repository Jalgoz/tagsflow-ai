import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { APP_NAV_ITEMS, APP_ROUTE_PATHS } from '../../shared/constants/routes'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'app-shell__nav-link',
    isActive ? 'app-shell__nav-link--active' : '',
  ]
    .filter(Boolean)
    .join(' ')

export const AppShell = () => {
  const { pathname } = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const activeNavItem = APP_NAV_ITEMS.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))

  const fallbackTitleSegment = pathname
    .split('/')
    .filter(Boolean)
    .at(0)

  const fallbackTitle =
    fallbackTitleSegment === undefined
      ? 'Workspace'
      : fallbackTitleSegment
          .split('-')
          .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
          .join(' ')

  const headerEyebrow = activeNavItem?.shortPath ?? 'workspace'
  const headerTitle = activeNavItem?.label ?? fallbackTitle
  const closeSidebar = () => setIsSidebarOpen(false)

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isSidebarOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isSidebarOpen])

  return (
    <div className={`app-shell ${isSidebarOpen ? 'app-shell--sidebar-open' : ''}`}>
      <button
        aria-expanded={isSidebarOpen}
        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        aria-controls="primary-navigation"
        className="app-shell__menu-toggle"
        type="button"
        onClick={() => setIsSidebarOpen((current) => !current)}
      >
        <span className={`app-shell__menu-toggle-icon${isSidebarOpen ? ' app-shell__menu-toggle-icon--open' : ''}`} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      <button
        aria-hidden="true"
        className={`app-shell__overlay${isSidebarOpen ? ' app-shell__overlay--visible' : ''}`}
        tabIndex={-1}
        type="button"
        onClick={closeSidebar}
      />

      <aside className={`app-shell__sidebar${isSidebarOpen ? ' app-shell__sidebar--open' : ''}`}>
        <div className="app-shell__brand">
          <div className="app-shell__brand-mark">TF</div>
          <div>
            <div className="app-shell__brand-name">TagsFlow AI</div>
            <div className="app-shell__brand-subtitle">Project foundation</div>
          </div>
        </div>

        <nav id="primary-navigation" className="app-shell__nav" aria-label="Primary navigation">
          {APP_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={navLinkClassName}
              end={item.path !== APP_ROUTE_PATHS.projects}
              onClick={closeSidebar}
            >
              <span>{item.label}</span>
              <span className="app-shell__nav-path">{item.shortPath}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-shell__main">
        <header className="app-shell__header">
          <div>
            <p className="app-shell__eyebrow">{headerEyebrow}</p>
            <h1 className="app-shell__title">{headerTitle}</h1>
          </div>
        </header>

        <main className="app-shell__content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
