// src/components/VocabularyItem.jsx
import AudioPlayer from './interactive/AudioPlayer';

const VocabularyItem = ({ term, definition, audioSrc }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow mb-2">
      <div>
        <h3 className="font-medium">{term}</h3>
        <p className="text-gray-600">{definition}</p>
      </div>
      <AudioPlayer src={audioSrc} label="Escuchar pronunciación" />
    </div>
  );
};

export default VocabularyItem;