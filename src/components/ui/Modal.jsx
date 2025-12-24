import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, customHeader, children, maxWidth = 'max-w-md' }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col`}>
        {customHeader ? (
          customHeader
        ) : (
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;