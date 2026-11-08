import { createBrowserRouter } from 'react-router-dom'
import GuestRoute from './auth/GuestRoute.tsx'
import ProtectedRoute from './auth/ProtectedRoute.tsx'
import Layout from './components/layout/Layout.tsx'
import HomePage from './pages/HomePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import MovieDetailPage from './pages/MovieDetailPage.tsx'
import MoviesPage from './pages/MoviesPage.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import RegisterPage from './pages/RegisterPage.tsx'

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
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [{ path: 'profile', element: <ProfilePage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
