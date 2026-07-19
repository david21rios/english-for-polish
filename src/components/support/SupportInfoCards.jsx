// src/components/support/SupportInfoCards.jsx

import {
  FaBug,
  FaBookOpen,
  FaLightbulb,
  FaUserShield
} from "react-icons/fa";

const SUPPORT_AREAS = [
  {
    value: "technical",
    icon: FaBug,
    title: "Problem techniczny",
    description:
      "Błędy aplikacji, problemy z działaniem platformy lub nieoczekiwane zachowanie."
  },
  {
    value: "account",
    icon: FaUserShield,
    title: "Konto użytkownika",
    description:
      "Logowanie, hasło, profil użytkownika, bezpieczeństwo oraz dostęp do konta."
  },
  {
    value: "course",
    icon: FaBookOpen,
    title: "Kurs i nauka",
    description:
      "Pytania dotyczące lekcji, testów, postępów oraz materiałów edukacyjnych."
  },
  {
    value: "suggestion",
    icon: FaLightbulb,
    title: "Sugestie i opinie",
    description:
      "Podziel się pomysłami, zgłoś usprawnienia lub przekaż swoją opinię o platformie."
  }
];

/**
 * Displays selectable support areas.
 *
 * @param {{
 *   selectedCategory?: string,
 *   onSelectCategory?: (category: string) => void
 * }} props
 * @returns {JSX.Element}
 */
const SupportInfoCards = ({
  selectedCategory = "",
  onSelectCategory
}) => {
  const handleSelect = (
    category
  ) => {
    if (
      typeof onSelectCategory ===
      "function"
    ) {
      onSelectCategory(category);
    }
  };

  return (
    <section
      aria-labelledby="support-areas-title"
    >
      <div className="mb-8">
        <h2
          id="support-areas-title"
          className="text-2xl font-bold text-gray-900"
        >
          W czym możemy pomóc?
        </h2>

        <p className="mt-2 max-w-3xl text-gray-600">
          Wybierz temat najbardziej zbliżony do Twojego problemu.
          Kategoria zostanie automatycznie ustawiona w formularzu.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {SUPPORT_AREAS.map(
          (area) => {
            const Icon =
              area.icon;

            const isSelected =
              selectedCategory ===
              area.value;

            return (
              <button
                key={area.value}
                type="button"
                onClick={() =>
                  handleSelect(
                    area.value
                  )
                }
                aria-pressed={
                  isSelected
                }
                className={`
                  rounded-2xl
                  border
                  p-6
                  text-left
                  shadow-sm
                  transition-all
                  duration-300
                  focus:outline-none
                  focus:ring-4
                  focus:ring-primary-100
                  ${
                    isSelected
                      ? "border-primary-500 bg-primary-50 shadow-md"
                      : "border-gray-200 bg-white hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg"
                  }
                `}
              >
                <div
                  className={`
                    mb-4
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    text-2xl
                    ${
                      isSelected
                        ? "bg-primary-600 text-white"
                        : "bg-primary-50 text-primary-600"
                    }
                  `}
                >
                  <Icon
                    aria-hidden="true"
                  />
                </div>

                <h3 className="text-lg font-semibold text-gray-900">
                  {area.title}
                </h3>

                <p className="mt-3 leading-7 text-gray-600">
                  {area.description}
                </p>

                {isSelected && (
                  <p className="mt-4 text-sm font-semibold text-primary-700">
                    Wybrana kategoria
                  </p>
                )}
              </button>
            );
          }
        )}
      </div>
    </section>
  );
};

export default SupportInfoCards;