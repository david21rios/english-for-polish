// components/shared/AlertModal.jsx
const AlertModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl transform transition-all">
        <div className="text-center">
          {/* Ícono de información */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Título */}
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
            Información importante
          </h3>

          {/* Mensaje */}
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              {message}
            </p>
          </div>

          {/* Botón */}
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;