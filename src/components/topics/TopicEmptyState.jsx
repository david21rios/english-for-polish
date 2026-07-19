// src/components/topics/TopicEmptyState.jsx

import {
  FaLayerGroup,
  FaRedo
} from "react-icons/fa";

const TopicEmptyState = ({
  title = "Nie ma jeszcze dostępnych tematów",
  description = "Administrator może opublikować nowe tematy w panelu administracyjnym.",
  actionLabel = "",
  onAction = null,
  loading = false
}) => {
  const canShowAction =
    typeof onAction === "function" &&
    String(actionLabel || "").trim();

  return (
    <section className="flex min-h-[240px] items-center justify-center px-4 py-10 text-center">
      <div className="w-full max-w-lg">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-2xl text-primary-600"
          aria-hidden="true"
        >
          <FaLayerGroup />
        </div>

        <h2 className="mt-5 text-xl font-bold text-gray-900">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          {description}
        </p>

        {canShowAction && (
          <button
            type="button"
            onClick={onAction}
            disabled={loading}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaRedo
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            {loading
              ? "Ładowanie..."
              : actionLabel}
          </button>
        )}
      </div>
    </section>
  );
};

export default TopicEmptyState;