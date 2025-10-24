
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">Msim724</h3>
            <p className="text-gray-600 dark:text-gray-400">
              بزرگترین پلتفرم خرید و فروش آنلاین سیمکارت های دائمی و اعتباری در ایران.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">دسترسی سریع</h4>
            <ul>
              <li className="mb-2"><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">قوانین و مقررات</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">درباره ما</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">تماس با ما</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">سوالات متداول</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">اپراتورها</h4>
             <ul>
              <li className="mb-2"><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">همراه اول</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">ایرانسل</a></li>
              <li className="mb-2"><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-500">رایتل</a></li>
            </ul>
          </div>
          <div>
             <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">نماد اعتماد</h4>
             <img src="https://picsum.photos/150/150?grayscale" alt="E-Namad" className="rounded-lg"/>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 text-center text-gray-500 dark:text-gray-400">
          <p>&copy; 1403 - تمامی حقوق برای Msim724 محفوظ است.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
