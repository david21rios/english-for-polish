// src/components/support/SupportSuccess.jsx

import {
  FaCheckCircle,
  FaEnvelopeOpenText
} from "react-icons/fa";

/**
 * Displays the success message after a support
 * ticket has been created.
 *
 * @param {{
 *   ticketId?: string,
 *   onCreateAnother?: () => void
 * }} props
 * @returns {JSX.Element}
 */
const SupportSuccess = ({
  ticketId = "",
  onCreateAnother
}) => {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm"
      aria-labelledby="support-success-title"
    >
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-10 text-white">
        <div className="flex flex-col items-center text-center">
          <FaCheckCircle
            className="mb-5 text-6xl"
            aria-hidden="true"
          />

          <h2
            id="support-success-title"
            className="text-3xl font-bold"
          >
            Zgłoszenie zostało wysłane
          </h2>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-green-50">
            Dziękujemy za kontakt.
            Otrzymaliśmy Twoje zgłoszenie i rozpoczniemy jego analizę
            tak szybko, jak to możliwe.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-8">

        <div className="rounded-xl border border-green-100 bg-green-50 p-5">
          <div className="flex gap-4">

            <div className="mt-1 text-green-600">
              <FaEnvelopeOpenText
                className="text-xl"
                aria-hidden="true"
              />
            </div>

            <div>

              <h3 className="font-semibold text-green-800">
                Co dalej?
              </h3>

              <ul className="mt-3 space-y-2 text-sm leading-6 text-green-700">

                <li>
                  • Nasz zespół przeanalizuje zgłoszenie.
                </li>

                <li>
                  • W razie potrzeby skontaktujemy się z Tobą,
                  korzystając z adresu e-mail przypisanego do konta.
                </li>

                <li>
                  • Odpowiedź zwykle wysyłamy w ciągu
                  2–3 dni roboczych.
                </li>

              </ul>

            </div>

          </div>
        </div>

        {ticketId && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">

            <p className="text-sm font-semibold text-gray-600">
              Identyfikator zgłoszenia
            </p>

            <code className="mt-3 block break-all rounded-lg bg-white px-4 py-3 text-sm text-gray-700">
              {ticketId}
            </code>

          </div>
        )}

        <div className="flex justify-center">

          <button
            type="button"
            onClick={onCreateAnother}
            className="
              rounded-xl
              bg-primary-600
              px-6
              py-3
              font-semibold
              text-white
              shadow-md
              transition-all
              duration-200
              hover:bg-primary-700
              hover:shadow-lg
              focus:outline-none
              focus:ring-4
              focus:ring-primary-200
            "
          >
            Wyślij kolejne zgłoszenie
          </button>

        </div>

      </div>

    </section>
  );
};

export default SupportSuccess;