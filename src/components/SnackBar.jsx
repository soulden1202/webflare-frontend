import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

// Enhanced ErrorSnackbar component that accepts different operations
export function ErrorSnackbar({ 
  message, 
  operation, 
  operationAction, 
  onClose, 
  isVisible 
}) {
  const [isShowing, setIsShowing] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
    } else {
      setIsShowing(false);
    }
  }, [isVisible]);

  if (!isVisible && !isShowing) return null;

  const getOperationLabel = () => {
    switch (operation) {
      case 'create': return 'Create';
      case 'update': return 'Update';
      case 'delete': return 'Delete';
      case 'fetch': return 'Fetch';
      default: return 'Retry';
    }
  };

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 flex items-center bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-sm transform transition-all duration-300 ${
        isShowing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <AlertCircle className="text-red-500 mr-3 flex-shrink-0" size={20} />
      <div className="flex-1">
        <p className="text-sm text-red-700">{message}</p>
        <button
          onClick={operationAction}
          className="mt-2 inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800"
        >
          <RefreshCw className="mr-1" size={16} />
          {getOperationLabel()} Again
        </button>
      </div>
      <button 
        onClick={onClose}
        className="ml-4 text-gray-400 hover:text-gray-600" 
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
}