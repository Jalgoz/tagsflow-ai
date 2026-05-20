import { Link } from 'react-router-dom'
import { APP_ROUTE_PATHS } from '../../shared/constants/routes'

export const NotFoundPage = () => {
  return (
    <section className="page-card page-card--centered">
      <p className="page-card__subtitle">Not found</p>
      <h2 className="page-card__title">This route does not exist</h2>
      <p className="page-card__description">
        Return to the dashboard or use the sidebar to move through the foundation routes.
      </p>
      <Link className="page-card__link" to={APP_ROUTE_PATHS.dashboard}>
        Go to dashboard
      </Link>
    </section>
  )
}
