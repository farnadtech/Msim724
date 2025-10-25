import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';

const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const { user, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    if(user){
      navigate(`/${user.role}`);
    }
  }, [user, navigate]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setOtpSent(false);
    try {
      await api.requestLoginOtp(identifier);
      setOtpSent(true);
      showNotification(`کد ورود به ${identifier} ارسال شد.`, 'info');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // Stays true on success until navigation
    try {
      const profile = await api.verifyOtpAndLogin(identifier, otp);
      setCurrentUser(profile);
      showNotification('با موفقیت وارد شدید. در حال انتقال...', 'success');
      // The useEffect listening to `user` will now handle navigation
    } catch (err) {
       setError(err instanceof Error ? err.message : 'کد وارد شده صحیح نیست.');
       setIsLoading(false); // Set loading to false ONLY on error
    }
  }

  return (
    <div className="flex items-center justify-center py-16 sm:py-24">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">ورود به Msim724</h1>
        
        {!otpSent ? (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label htmlFor="identifier" className="block mb-2 text-sm font-medium">ایمیل</label>
              <input
                type="email"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-200 dark:bg-gray-700"
                placeholder="user@example.com"
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400" disabled={isLoading}>
              {isLoading ? 'در حال ارسال...' : 'ارسال کد ورود'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <p className="text-center text-sm">کد ۶ رقمی ارسال شده به <span className="font-bold">{identifier}</span> را وارد کنید.</p>
            <div>
              <label htmlFor="otp" className="block mb-2 text-sm font-medium">کد تایید</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-3 py-2 text-center tracking-[1em] border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring focus:ring-blue-200 dark:bg-gray-700"
                maxLength={6}
                required
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400" disabled={isLoading}>
              {isLoading ? 'در حال بررسی...' : 'ورود'}
            </button>
             <button type="button" onClick={() => {setOtpSent(false); setError('');}} className="w-full text-sm text-center text-blue-600 hover:underline" disabled={isLoading}>
                ویرایش ایمیل
            </button>
          </form>
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