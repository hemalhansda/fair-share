import React from 'react';
import { Plus } from 'lucide-react';
import Button from '../ui/Button';

const FloatingActionButton = ({ onClick }) => (
  <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8">
    <Button 
      onClick={onClick}
      className="rounded-full w-14 h-14 !p-0 shadow-lg shadow-emerald-300 flex items-center justify-center transform hover:scale-105 active:scale-95"
    >
      <Plus size={28} />
    </Button>
  </div>
);

export default FloatingActionButton;