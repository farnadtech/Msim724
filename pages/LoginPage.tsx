

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    if(user){
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setLinkSent(false);
    try {
      await api.requestLoginOtp(identifier);
      setLinkSent(true);
      showNotification(`لینک ورود به ${identifier} ارسال شد.`, 'info');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">ورود به Msim724</h1>
        
        {!linkSent ? (
          <form onSubmit={handleRequestLink} className="space-y-6">
            <div>
              <label htmlFor="identifier" className="block mb-2 text-sm font-medium">ایمیل یا شماره موبایل</label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-200 dark:bg-gray-700"
                placeholder="0912... یا user@example.com"
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400" disabled={isLoading}>
              {isLoading ? 'در حال ارسال...' : 'ارسال لینک ورود'}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
             <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M12 12a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
            <h2 className="text-xl font-semibold">ایمیل خود را بررسی کنید</h2>
            <p className="text-gray-600 dark:text-gray-400">
              لینک ورود به ایمیل <span className="font-bold">{identifier}</span> ارسال شد. لطفاً روی لینک کلیک کنید تا وارد حساب کاربری خود شوید.
            </p>
             <button type="button" onClick={() => {setLinkSent(false); setError('');}} className="w-full text-sm text-center text-blue-600 hover:underline" disabled={isLoading}>
                ارسال مجدد یا ویرایش ایمیل/شماره
            </button>
          </div>
        )}
        <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
                حساب کاربری ندارید؟ <Link to="/signup" className="font-medium text-blue-600 hover:underline">ثبت نام کنید</Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;