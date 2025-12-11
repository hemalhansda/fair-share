import React from 'react';
import { Plus } from 'lucide-react';
import Button from '../ui/Button';

const FloatingActionButton = ({ onClick }) => (
  <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50">
    <Button 
      onClick={onClick}
      className="rounded-full w-14 h-14 md:w-16 md:h-16 !p-0 shadow-lg shadow-emerald-300 flex items-center justify-center transform hover:scale-105 active:scale-95 transition-transform"
    >
      <Plus size={28} className="md:w-8 md:h-8" />
    </Button>
  </div>
);

export default FloatingActionButton;