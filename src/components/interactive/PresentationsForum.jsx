// src/components/interactive/PresentationsForum.jsx
import React, { useState, useEffect } from 'react';
import { FaUser, FaMicrophone, FaPlay, FaPause, FaComment, FaTimes } from 'react-icons/fa';
import AudioRecorder from './AudioRecorder';
import PresentationComment from './PresentationComment';
import { getPresentations, addPresentation, addComment, uploadAudio } from '../../services/firestoreService';

const PresentationsForum = ({ levelId, lessonId }) => {
  const [presentations, setPresentations] = useState([]);
  const [newPresentation, setNewPresentation] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [activeReply, setActiveReply] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPresentations();
  }, [levelId, lessonId]);

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      const fetchedPresentations = await getPresentations(levelId, lessonId);
      setPresentations(fetchedPresentations);
    } catch (err) {
      setError('Error al cargar las presentaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPresentation.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      let audioUrl = null;
      if (audioBlob) {
        audioUrl = await uploadAudio(audioBlob);
      }

      await addPresentation({
        levelId,
        lessonId,
        text: newPresentation,
        audioUrl,
        author: 'Usuario', // Esto debería venir de tu sistema de autenticación
        authorId: 'user123', // Esto debería venir de tu sistema de autenticación
        comments: [] // Inicializar el array de comentarios
      });

      setNewPresentation('');
      setAudioBlob(null);
      await fetchPresentations();
    } catch (err) {
      setError('Error al publicar la presentación');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComment = async (presentationId) => {
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const commentData = {
        id: Date.now().toString(),
        text: newComment,
        author: 'Usuario', // Esto debería venir de tu sistema de autenticación
        authorId: 'user123', // Esto debería venir de tu sistema de autenticación
        createdAt: new Date().toISOString(),
        replyTo: activeReply
      };

      await addComment(presentationId, commentData);
      setNewComment('');
      setActiveReply(null);
      await fetchPresentations();
    } catch (err) {
      setError('Error al añadir el comentario');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId) => {
    try {
      // Implementar la lógica para dar like
      console.log('Like dado al comentario:', commentId);
      await fetchPresentations();
    } catch (err) {
      setError('Error al dar like al comentario');
      console.error(err);
    }
  };

  const handleReply = (commentId) => {
    setActiveReply(commentId === activeReply ? null : commentId);
  };

  const clearError = () => {
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 text-red-600 p-4 rounded-lg relative">
          {error}
          <button
            onClick={clearError}
            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Formulario para nueva presentación */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Comparte tu presentación</h3>
        <textarea
          value={newPresentation}
          onChange={(e) => setNewPresentation(e.target.value)}
          className="w-full p-3 border rounded-lg mb-4"
          rows="4"
          placeholder="Escribe tu presentación personal..."
          disabled={isSubmitting}
        />

        {/* <div className="mb-4">
          <AudioRecorder onRecordingComplete={setAudioBlob} />
        </div> */}

        <button
          type="submit"
          className={`px-4 py-2 bg-primary-600 text-white rounded-lg transition-colors ${isSubmitting
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-primary-700'
            }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Publicando...' : 'Publicar presentación'}
        </button>
      </form>

      {/* Lista de presentaciones */}
      <div className="space-y-4">
        {presentations.map((presentation) => (
          <div key={presentation.id} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <FaUser className="text-gray-500" />
                </div>
              </div>

              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{presentation.author}</h4>
                  <span className="text-sm text-gray-500">
                    {presentation.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>

                <p className="mt-2 text-gray-700">{presentation.text}</p>

                {presentation.audioUrl && (
                  <div className="mt-3">
                    <audio controls className="w-full">
                      <source src={presentation.audioUrl} type="audio/wav" />
                    </audio>
                  </div>
                )}

                {/* Comentarios */}
                <div className="mt-4">
                  {presentation.comments?.map((comment) => (
                    <PresentationComment
                      key={comment.id}
                      comment={comment}
                      onReply={() => handleReply(comment.id)}
                      onLike={() => handleLike(comment.id)}
                      isReplyActive={activeReply === comment.id}
                    />
                  ))}
                </div>

                {/* Formulario de comentarios */}
                <div className="mt-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-grow p-2 border rounded-lg"
                      placeholder={activeReply ? "Responder al comentario..." : "Añade un comentario..."}
                      disabled={isSubmitting}
                    />
                    <button
                      onClick={() => handleComment(presentation.id)}
                      className={`px-4 py-2 bg-primary-600 text-white rounded-lg transition-colors ${isSubmitting
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-primary-700'
                        }`}
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? 'Enviando...'
                        : activeReply
                          ? "Responder"
                          : "Comentar"
                      }
                    </button>
                    {activeReply && (
                      <button
                        onClick={() => setActiveReply(null)}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PresentationsForum;