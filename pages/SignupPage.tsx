import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { UserRole } from '../types';
// FIX: Import the 'supabase' client to resolve the "Cannot find name 'supabase'" error.
import { supabase } from '../services/supabaseClient';

const SignupPage: React.FC = () => {
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [formData, setFormData] = useState({
    name: '',
    identifier: '', // Can be email or phone
    role: 'buyer' as UserRole,
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    // If a user is already logged in, redirect them away from signup.
    if (user) {
        navigate(`/${user.role}`);
    }
  }, [user, navigate]);


  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEmail(formData.identifier)) {
        setError('لطفا ایمیل معتبر وارد کنید.');
        return;
    }
    
    setIsLoading(true);
    try {
      await api.requestLoginOtp(formData.identifier);
      setStep('verify');
      showNotification(`کد تایید به ${formData.identifier} ارسال شد.`, 'info');
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
        // FIX: Add a runtime check to narrow the type of `formData.role` from `UserRole`
        // to `'buyer' | 'seller'` to match the expected type of `api.verifyOtpAndRegister`.
        if (formData.role !== 'buyer' && formData.role !== 'seller') {
          throw new Error('Registration is only possible as a buyer or seller.');
        }

        const profile = await api.verifyOtpAndRegister({
            name: formData.name,
            identifier: formData.identifier,
            role: formData.role, // The type is now correctly narrowed
            otp
        });
        
        setCurrentUser(profile);
        showNotification('ثبت نام شما با موفقیت تکمیل شد. در حال انتقال...', 'success');
        // The useEffect listening to the `user` state will now handle navigation.
    } catch (err) {
        setError(err instanceof Error ? err.message : 'خطا در تایید کد.');
        setIsLoading(false); // Set to false only on error
    }
  };

  return (
    <div className="flex items-center justify-center py-16 sm:py-24">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">ایجاد حساب کاربری جدید</h1>
        
        {step === 'details' && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium">نام و نام خانوادگی</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleDetailsChange} required disabled={isLoading} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700"/>
            </div>
             <div>
              <label htmlFor="identifier" className="block mb-2 text-sm font-medium">ایمیل</label>
              <input type="email" id="identifier" name="identifier" value={formData.identifier} onChange={handleDetailsChange} required disabled={isLoading} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700" placeholder="user@example.com" />
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
              {isLoading ? 'در حال ارسال...' : 'ارسال کد تایید'}
            </button>
          </form>
        )}

        {step === 'verify' && (
           <form onSubmit={handleVerifyOtp} className="space-y-6">
            <p className="text-center text-sm">کد ۶ رقمی ارسال شده به <span className="font-bold">{formData.identifier}</span> را وارد کنید.</p>
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
              {isLoading ? 'در حال ثبت نام...' : 'تایید و ثبت نام'}
            </button>
            <button type="button" onClick={() => {setStep('details'); setError('');}} className="w-full text-sm text-center text-blue-600 hover:underline" disabled={isLoading}>
                ویرایش اطلاعات
            </button>
          </form>
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