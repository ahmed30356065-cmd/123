
import React from 'react';
import { User } from '../../types';
import { XIcon, CheckCircleIcon, TrashIcon, UserIcon, PhoneIcon, ClockIcon } from '../icons';

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
  onApprove: (userId: string, updatedData: Partial<User>) => void;
  onDelete: (userId: string) => void;
}

const getRoleName = (role: string) => {
    switch (role) {
        case 'merchant': return 'تاجر';
        case 'driver': return 'سائق';
        default: return role;
    }
}

const InfoRow: React.FC<{ label: string; value: string; icon?: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-center py-3 border-b border-gray-700 last:border-b-0">
        <div className="w-10 flex-shrink-0 flex justify-center items-center text-neutral-400">
            {icon || <div className="w-5 h-5" />}
        </div>
        <div className="mr-3">
            <p className="text-sm text-neutral-400">{label}</p>
            <p className="font-semibold text-neutral-100">{value}</p>
        </div>
    </div>
);

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose, onApprove, onDelete }) => {

    const handleApprove = () => {
        onApprove(user.id, { status: 'active' });
        onClose();
    };

    const handleDelete = () => {
        onDelete(user.id);
        onClose();
    };

    const formattedDate = (() => {
        try {
            const d = new Date(user.createdAt);
            if (isNaN(d.getTime())) return 'غير متوفر';
            // Use strictly numeric components to prevent RangeError on older WebViews
            return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
        } catch (e) {
            return 'غير متوفر';
        }
    })();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-neutral-100">تفاصيل المستخدم الجديد</h3>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">
                    <div className="space-y-0">
                        <InfoRow label="اسم المستخدم" value={user.name} icon={<UserIcon className="w-5 h-5" />} />
                        <InfoRow label="الدور" value={getRoleName(user.role)} />
                        <InfoRow label="رقم الهاتف" value={user.phone || 'غير متوفر'} icon={<PhoneIcon className="w-5 h-5" />} />
                        <InfoRow label="تاريخ الإنشاء" value={formattedDate} icon={<ClockIcon className="w-5 h-5" />} />
                    </div>
                </div>
                <div className="bg-gray-900 px-4 py-3 sm:px-6 flex flex-row-reverse rounded-b-lg space-x-2 space-x-reverse">
                    <button
                        type="button"
                        onClick={handleApprove}
                        className="flex-1 inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 sm:text-sm"
                    >
                        <CheckCircleIcon className="w-5 h-5 ml-2" />
                        موافقة
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        className="flex-1 inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 sm:text-sm"
                    >
                        <TrashIcon className="w-5 h-5 ml-2" />
                        حذف
                    </button>
                     <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-neutral-200 hover:bg-gray-600 focus:outline-none sm:w-auto sm:text-sm"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;
