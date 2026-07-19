// src/components/topics/personalization/PersonalizationNavigation.jsx

import {
  FaArrowLeft,
  FaArrowRight,
  FaMagic,
  FaSpinner
} from "react-icons/fa";

const PersonalizationNavigation = ({
  currentStepIndex = 0,
  totalSteps = 5,

  onBack,
  onNext,
  onGenerate,

  backDisabled = false,
  nextDisabled = false,
  generateDisabled = false,

  generating = false,

  backLabel = "Wstecz",
  nextLabel = "Dalej",
  generateLabel = "Wygeneruj misję"
}) => {
  const normalizedCurrentStep =
    Math.max(
      0,
      Number(currentStepIndex) || 0
    );

  const normalizedTotalSteps =
    Math.max(
      1,
      Number(totalSteps) || 1
    );

  const isFirstStep =
    normalizedCurrentStep === 0;

  const isLastConfigurationStep =
    normalizedCurrentStep ===
    normalizedTotalSteps - 2;

  const isPreviewStep =
    normalizedCurrentStep ===
    normalizedTotalSteps - 1;

  const canGoBack =
    typeof onBack ===
      "function" &&
    !isFirstStep &&
    !backDisabled &&
    !generating;

  const canGoNext =
    typeof onNext ===
      "function" &&
    !isLastConfigurationStep &&
    !isPreviewStep &&
    !nextDisabled &&
    !generating;

  const canGenerate =
    typeof onGenerate ===
      "function" &&
    isLastConfigurationStep &&
    !generateDisabled &&
    !generating;

  return (
    <footer className="mt-6 border-t border-gray-100 pt-5 md:mt-8 md:pt-6">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors ${
            canGoBack
              ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
          }`}
        >
          <FaArrowLeft />
          {backLabel}
        </button>

        {!isPreviewStep && (
          <div className="sm:ml-auto">
            {isLastConfigurationStep ? (
              <button
                type="button"
                onClick={onGenerate}
                disabled={!canGenerate}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors sm:w-auto ${
                  canGenerate
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "cursor-not-allowed bg-gray-300 text-gray-500"
                }`}
              >
                {generating ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaMagic />
                )}

                {generating
                  ? "Tworzenie misji..."
                  : generateLabel}
              </button>
            ) : (
              <button
                type="button"
                onClick={onNext}
                disabled={!canGoNext}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors sm:w-auto ${
                  canGoNext
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "cursor-not-allowed bg-gray-300 text-gray-500"
                }`}
              >
                {nextLabel}
                <FaArrowRight />
              </button>
            )}
          </div>
        )}
      </div>

      {!isPreviewStep && (
        <p className="mt-3 text-center text-xs text-gray-400 sm:text-right">
          Krok{" "}
          {normalizedCurrentStep + 1} z{" "}
          {normalizedTotalSteps - 1}
        </p>
      )}
    </footer>
  );
};

export default PersonalizationNavigation;