// src/components/topics/TopicLoading.jsx

const TopicLoading = ({
  message = "Ładowanie tematów..."
}) => {
  return (
    <div
      className="flex min-h-[240px] items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center">
        <div
          className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600"
          aria-hidden="true"
        />

        <p className="text-sm text-gray-600">
          {message}
        </p>
      </div>
    </div>
  );
};

export default TopicLoading;