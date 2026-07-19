// src/components/support/SupportForm.jsx

import {
  useEffect,
  useState
} from "react";

import {
  createSupportTicket,
  getFriendlySupportError,
  isValidSupportCategory,
  validateSupportTicket
} from "../../services/support";

import SupportCategorySelect from "./SupportCategorySelect";
import SupportSubjectField from "./SupportSubjectField";
import SupportMessageField from "./SupportMessageField";
import SupportSubmitButton from "./SupportSubmitButton";

const INITIAL_FORM_VALUES = {
  category: "",
  subject: "",
  message: "",
  priority: "normal"
};

const INITIAL_FORM_ERRORS = {
  category: "",
  subject: "",
  message: "",
  priority: ""
};

/**
 * Displays and manages the authenticated
 * support ticket form.
 *
 * @param {{
 *   initialCategory?: string,
 *   onSuccess?: (ticketId: string) => void
 * }} props
 * @returns {JSX.Element}
 */
const SupportForm = ({
  initialCategory = "",
  onSuccess
}) => {
  const [formValues, setFormValues] =
    useState({
      ...INITIAL_FORM_VALUES,
      category:
        isValidSupportCategory(initialCategory)
          ? initialCategory
          : ""
    });

  const [formErrors, setFormErrors] =
    useState(INITIAL_FORM_ERRORS);

  const [submitError, setSubmitError] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /**
   * Keeps the form category synchronized with
   * selections made outside the form, such as
   * SupportInfoCards.
   */
  useEffect(() => {
    if (
      !initialCategory ||
      !isValidSupportCategory(initialCategory)
    ) {
      return;
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      category: initialCategory
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      category: ""
    }));
  }, [initialCategory]);

  /**
   * Updates a form field and clears its current
   * validation error.
   *
   * @param {
   *   React.ChangeEvent<
   *     HTMLInputElement |
   *     HTMLTextAreaElement |
   *     HTMLSelectElement
   *   >
   * } event
   */
  const handleChange = (
    event
  ) => {
    const {
      name,
      value
    } = event.target;

    setFormValues(
      (currentValues) => ({
        ...currentValues,
        [name]: value
      })
    );

    if (
      formErrors[name]
    ) {
      setFormErrors(
        (currentErrors) => ({
          ...currentErrors,
          [name]: ""
        })
      );
    }

    if (submitError) {
      setSubmitError("");
    }
  };

  /**
   * Resets the form after a successful submission.
   */
  const resetForm = () => {
    setFormValues({
      ...INITIAL_FORM_VALUES,
      category:
        isValidSupportCategory(initialCategory)
          ? initialCategory
          : ""
    });

    setFormErrors(
      INITIAL_FORM_ERRORS
    );

    setSubmitError("");
  };

  /**
   * Validates and creates a support ticket.
   *
   * @param {React.FormEvent<HTMLFormElement>} event
   */
  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSubmitError("");

    const validation =
      validateSupportTicket(
        formValues
      );

    if (!validation.isValid) {
      setFormErrors({
        ...INITIAL_FORM_ERRORS,
        ...validation.errors
      });

      return;
    }

    setFormErrors(
      INITIAL_FORM_ERRORS
    );

    setIsSubmitting(true);

    try {
      const ticketId =
        await createSupportTicket(
          validation.values
        );

      resetForm();

      if (
        typeof onSuccess ===
        "function"
      ) {
        onSuccess(ticketId);
      }
    } catch (error) {
      console.error(
        "Support form submission failed:",
        error
      );

      setSubmitError(
        getFriendlySupportError(
          error
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="support-form-title"
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-600">
          Nowe zgłoszenie
        </p>

        <h2
          id="support-form-title"
          className="mt-2 text-2xl font-bold text-gray-900"
        >
          Opisz swoją sprawę
        </h2>

        <p className="mt-3 max-w-3xl leading-7 text-gray-600">
          Podaj kategorię, krótki temat oraz szczegółowy opis.
          Im więcej istotnych informacji przekażesz, tym łatwiej
          będzie nam przeanalizować zgłoszenie.
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <SupportCategorySelect
          value={formValues.category}
          onChange={handleChange}
          error={formErrors.category}
          disabled={isSubmitting}
        />

        <SupportSubjectField
          value={formValues.subject}
          onChange={handleChange}
          error={formErrors.subject}
          disabled={isSubmitting}
        />

        <SupportMessageField
          value={formValues.message}
          onChange={handleChange}
          error={formErrors.message}
          disabled={isSubmitting}
        />

        {submitError && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="text-sm font-medium text-red-700">
              {submitError}
            </p>
          </div>
        )}

        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-xl text-sm leading-6 text-gray-500">
              Wysyłając zgłoszenie, potwierdzasz, że podane
              informacje mogą zostać wykorzystane do rozwiązania
              opisanego problemu.
            </p>

            <SupportSubmitButton
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </form>
    </section>
  );
};

export default SupportForm;