import { createBrowserRouter } from 'react-router-dom'
import GuestRoute from './auth/GuestRoute.tsx'
import ProtectedRoute from './auth/ProtectedRoute.tsx'
import Layout from './components/layout/Layout.tsx'
import HomePage from './pages/HomePage.tsx'
import AuthPage from './pages/AuthPage.tsx'
import MovieDetailPage from './pages/MovieDetailPage.tsx'
import MoviesPage from './pages/MoviesPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'movies', element: <MoviesPage /> },
      { path: 'movies/:id', element: <MovieDetailPage /> },
      {
        element: <GuestRoute />,
        children: [
          { path: 'login', element: <AuthPage mode="login" /> },
          { path: 'register', element: <AuthPage mode="register" /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [{ path: 'profile', element: <ProfilePage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
], {
  // Pages'te uygulama bir alt klasörde çalışır; yerelde BASE_URL '/' olduğundan değişiklik yok
  basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
})
