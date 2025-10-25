import React from 'react';

const CODE_SNIPPET = `import { createClient } from '@supabase/supabase-js';

// Find your credentials in your Supabase project's dashboard
// at Project Settings > API
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseAnonKey = 'your-anon-public-key';

// ... rest of the file
`;

export const ConfigurationNotice: React.FC = () => {
    return (
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8">
                <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
                        پیکربندی Supabase الزامی است
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        برای اجرای برنامه، باید اطلاعات پروژه Supabase خود را وارد کنید.
                    </p>
                </div>

                <div className="mt-8">
                    <p className="font-semibold">
                        ۱. فایل زیر را در ویرایشگر کد خود باز کنید:
                    </p>
                    <code className="block w-full text-left bg-gray-100 dark:bg-gray-700 rounded-md p-3 mt-2 font-mono text-sm" dir="ltr">
                        services/supabaseClient.ts
                    </code>

                    <p className="mt-6 font-semibold">
                        ۲. مقادیر <code className="text-sm">supabaseUrl</code> و <code className="text-sm">supabaseAnonKey</code> را با مقادیر واقعی پروژه خود جایگزین کنید:
                    </p>

                    <pre className="bg-gray-900 text-white rounded-lg p-4 mt-2 text-left text-sm overflow-x-auto" dir="ltr">
                        <code className="font-mono">
                            {CODE_SNIPPET}
                        </code>
                    </pre>

                    <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
                        می‌توانید این اطلاعات را در داشبورد پروژه Supabase خود در بخش{' '}
                        <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                            Project Settings &gt; API
                        </a>
                        {' '}پیدا کنید.
                    </p>
                </div>
            </div>
        </div>
    );
};
