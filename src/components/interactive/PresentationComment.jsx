// src/components/interactive/PresentationComment.jsx
import React from 'react';
import { FaReply, FaThumbsUp, FaUser } from 'react-icons/fa';

const PresentationComment = ({ comment, onReply, onLike, isReplyActive }) => {
  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';

    // Si es un timestamp de Firestore
    if (dateString?.toDate) {
      return dateString.toDate().toLocaleDateString();
    }

    // Si es una fecha ISO
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  return (
    <div className="pl-4 border-l-2 border-gray-200 mt-2">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <FaUser className="text-gray-500 text-sm" />
          </div>
        </div>

        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-sm">{comment.author}</p>
              <p className="text-gray-600 text-sm mt-1">{comment.text}</p>
            </div>
            <span className="text-xs text-gray-500">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onLike(comment.id)}
              className={`text-gray-500 hover:text-primary-600 text-sm flex items-center gap-1 transition-colors ${isReplyActive ? 'text-primary-600' : ''
                }`}
            >
              <FaThumbsUp />
              <span>{comment.likes || 0}</span>
            </button>
            <button
              onClick={() => onReply(comment.id)}
              className={`text-gray-500 hover:text-primary-600 text-sm flex items-center gap-1 transition-colors ${isReplyActive ? 'text-primary-600' : ''
                }`}
            >
              <FaReply />
              <span>Responder</span>
            </button>
          </div>

          {/* Respuestas al comentario */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply, index) => (
                <div key={index} className="pl-4 border-l border-gray-200">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <FaUser className="text-gray-500 text-xs" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{reply.author}</p>
                      <p className="text-gray-600 text-sm">{reply.text}</p>
                      <span className="text-xs text-gray-500">
                        {formatDate(reply.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PresentationComment;