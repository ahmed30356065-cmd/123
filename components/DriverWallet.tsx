import React from 'react';
import { WalletIcon } from './icons';

interface DriverWalletProps {
    balance: number;
}

const DriverWallet: React.FC<DriverWalletProps> = ({ balance }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <WalletIcon className="w-6 h-6 ml-2 text-green-600"/>
                المحفظة
            </h3>
            <div className="text-center bg-gray-50 p-8 rounded-lg">
                <p className="text-gray-500 text-sm mb-2">الرصيد الحالي</p>
                <p className="text-4xl font-bold text-green-700">
                    {balance.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                </p>
            </div>
        </div>
    );
};

export default DriverWallet;