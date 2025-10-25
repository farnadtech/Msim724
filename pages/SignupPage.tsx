import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { UserRole } from '../types';
// FIX: Import the 'supabase' client to resolve the "Cannot find name 'supabase'" error.
import { supabase } from '../services/supabaseClient';

const SignupPage: React.FC = () => {
  const [step, setStep] = useState<'details' | 'confirm'>('details');
  const [formData, setFormData] = useState({
    name: '',
    identifier: '', // Can be email or phone
    role: 'buyer' as UserRole,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // This effect will run when the user clicks the magic link and is redirected back to the app.
  // The AuthContext will pick up the session from the URL, set the authUser,
  // but the user profile might not be created yet.
  useEffect(() => {
      const completeRegistration = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && !user) { // Auth user exists, but no profile yet
              // Check if we have pending registration details in sessionStorage
              const pendingReg = sessionStorage.getItem('pendingRegistration');
              if (pendingReg) {
                  const { name, role } = JSON.parse(pendingReg);
                  try {
                      const newUserProfile = await api.verifyOtpAndRegister({
                          identifier: session.user.email || session.user.phone || '',
                          otp: '', // OTP not needed for magic link flow, just need to create profile
                          name,
                          role
                      });
                      setCurrentUser(newUserProfile);
                      sessionStorage.removeItem('pendingRegistration');
                      showNotification('ثبت نام شما با موفقیت تکمیل شد.', 'success');
                      navigate(`/${newUserProfile.role}`);
                  } catch (err) {
                      setError(err instanceof Error ? err.message : 'خطا در تکمیل ثبت نام.');
                  }
              }
          } else if (user) {
              // If a full user profile already exists, just redirect.
              navigate(`/${user.role}`);
          }
      };
      
      completeRegistration();
  }, [user, navigate, setCurrentUser, showNotification]);


  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isPhoneNumber = (str: string) => /^09\d{9}$/.test(str);
  const isEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPhoneNumber(formData.identifier) && !isEmail(formData.identifier)) {
        setError('لطفا ایمیل یا شماره موبایل معتبر وارد کنید.');
        return;
    }
    
    setIsLoading(true);
    try {
      // Temporarily store name and role to be used after email verification
      sessionStorage.setItem('pendingRegistration', JSON.stringify({ name: formData.name, role: formData.role }));

      await api.requestLoginOtp(formData.identifier);
      setStep('confirm');
      showNotification(`لینک تایید به ${formData.identifier} ارسال شد.`, 'info');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
      sessionStorage.removeItem('pendingRegistration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] py-8">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">ایجاد حساب کاربری جدید</h1>
        
        {step === 'details' && (
          <form onSubmit={handleRequestLink} className="space-y-6">
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium">نام و نام خانوادگی</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleDetailsChange} required disabled={isLoading} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"/>
            </div>
             <div>
              <label htmlFor="identifier" className="block mb-2 text-sm font-medium">ایمیل یا شماره موبایل</label>
              <input type="text" id="identifier" name="identifier" value={formData.identifier} onChange={handleDetailsChange} required disabled={isLoading} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700" placeholder="0912... یا user@example.com" />
            </div>
             <div>
              <label className="block mb-2 text-sm font-medium">قصد... را دارم</label>
              <div className="flex space-x-4 space-x-reverse">
                <label className="flex items-center"><input type="radio" name="role" value="buyer" checked={formData.role === 'buyer'} onChange={handleDetailsChange} className="ml-2" /> خرید سیمکارت</label>
                <label className="flex items-center"><input type="radio" name="role" value="seller" checked={formData.role === 'seller'} onChange={handleDetailsChange} className="ml-2" /> فروش سیمکارت</label>
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400" disabled={isLoading}>
              {isLoading ? 'در حال ارسال...' : 'ارسال لینک تایید'}
            </button>
          </form>
        )}

        {step === 'confirm' && (
          <div className="text-center space-y-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M12 12a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
            <h2 className="text-xl font-semibold">ایمیل خود را بررسی کنید</h2>
            <p className="text-gray-600 dark:text-gray-400">
              برای تکمیل ثبت نام، روی لینک ارسال شده به <span className="font-bold">{formData.identifier}</span> کلیک کنید.
            </p>
            <button type="button" onClick={() => {setStep('details'); setError('');}} className="w-full text-sm text-center text-blue-600 hover:underline" disabled={isLoading}>
                ویرایش اطلاعات
            </button>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            قبلا ثبت نام کرده اید؟ <Link to="/login" className="font-medium text-blue-600 hover:underline">وارد شوید</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;