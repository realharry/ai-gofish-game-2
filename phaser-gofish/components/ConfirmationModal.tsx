import React, { useState, useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const frameId = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frameId);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-sm text-center border-2 border-yellow-400 transition-all duration-300 ease-out"
        style={{
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(10px)',
          opacity: visible ? 1 : 0,
        }}
      >
        <h2 className="text-2xl font-bold text-yellow-300 mb-2">{title}</h2>
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
            <button
                onClick={onClose}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
            >
                Confirm
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
