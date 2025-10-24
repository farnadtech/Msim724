
import React from 'react';
// FIX: Replaced v5 `useHistory` with v6 `useNavigate` to resolve module export error.
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    if (user) {
      navigate(`/${user.role}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          Msim724
        </Link>
        <nav className="hidden md:flex items-center space-x-reverse space-x-6">
          <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-blue-500">صفحه اصلی</Link>
          <Link to="/rond-numbers" className="text-gray-600 dark:text-gray-300 hover:text-blue-500">شماره های رند</Link>
          <Link to="/auctions" className="text-gray-600 dark:text-gray-300 hover:text-blue-500">حراجی ها</Link>
          <Link to="/packages" className="text-gray-600 dark:text-gray-300 hover:text-blue-500">تعرفه ها</Link>
        </nav>
        <div className="flex items-center space-x-reverse space-x-4">
          {user ? (
            <div className="relative group pb-2">
              <button onClick={handleDashboardClick} className="flex items-center space-x-2 space-x-reverse bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full">
                 <span>{user.name}</span>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 hidden group-hover:block group-focus-within:block">
                  <button onClick={handleDashboardClick} className="block w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">پنل کاربری</button>
                  <button onClick={handleLogout} className="block w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">خروج</button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-colors">
              ورود / ثبت نام
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
