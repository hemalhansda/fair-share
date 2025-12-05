import React from 'react';
import { PieChart } from 'lucide-react';
import Avatar from '../ui/Avatar';

const MobileHeader = ({ currentUser }) => (
  <div className="md:hidden bg-white p-4 flex items-center justify-between border-b border-gray-200 sticky top-0 z-20">
    <div className="flex items-center gap-2 text-emerald-600">
      <PieChart className="w-6 h-6" />
      <h1 className="text-lg font-bold">fyrShare</h1>
    </div>
    <Avatar user={currentUser} size="sm" />
  </div>
);

export default MobileHeader;