
import React from 'react';
import { User } from '../types';
import RoleSelection from './RoleSelection';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 pt-safe" dir="rtl">
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">أهلاً بك في نظام التوصيل</h1>
            <p className="text-gray-500 mt-2">اختر دورك للمتابعة</p>
        </div>
        <RoleSelection users={users} onSelectUser={onLogin} />
      </div>
    </div>
  );
};

export default LoginScreen;
