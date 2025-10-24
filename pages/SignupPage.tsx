import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { UserRole } from '../types';

const SignupPage: React.FC = () => {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [formData, setFormData] = useState({
    name: '',
    identifier: '', // Can be email or phone
    role: 'buyer' as UserRole,
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isPhoneNumber = (str: string) => /^09\d{9}$/.test(str);
  const isEmail = (str: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPhoneNumber(formData.identifier) && !isEmail(formData.identifier)) {
        setError('لطفا ایمیل یا شماره موبایل معتبر وارد کنید.');
        return;
    }
    
    setIsLoading(true);
    try {
      const signupDetails = {
        name: formData.name,
        role: formData.role as 'buyer' | 'seller',
        ...(isEmail(formData.identifier) && { email: formData.identifier }),
        ...(isPhoneNumber(formData.identifier) && { phoneNumber: formData.identifier }),
      };
      await api.requestSignupOtp(signupDetails);
      setStep('otp');
      showNotification(`کد تایید به ${formData.identifier} ارسال شد. (کد نمونه: 1234)`, 'info');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
        const newUser = await api.verifyOtpAndRegister(formData.identifier, otp);
        setCurrentUser(newUser);
        showNotification('ثبت نام شما با موفقیت انجام شد.', 'success');
        navigate(`/${newUser.role}`);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'خطای ناشناخته');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] py-8">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">ایجاد حساب کاربری جدید</h1>
        
        {step === 'details' && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
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
              {isLoading ? 'در حال ارسال...' : 'ارسال کد تایید'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                کد تایید ارسال شده به <span className="font-bold">{formData.identifier}</span> را وارد کنید.
              </p>
            </div>
            <div>
              <label htmlFor="otp" className="block mb-2 text-sm font-medium">کد تایید</label>
              <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required disabled={isLoading} className="w-full px-3 py-2 text-center tracking-[1rem] border rounded-md dark:bg-gray-700" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400" disabled={isLoading}>
                {isLoading ? 'در حال بررسی...' : 'ایجاد حساب کاربری'}
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
