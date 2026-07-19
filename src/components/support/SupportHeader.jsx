// src/components/support/SupportHeader.jsx

import {
  FaHeadset,
  FaRegClock,
  FaShieldAlt
} from "react-icons/fa";

/**
 * Displays the introductory header for the
 * authenticated support center.
 *
 * @returns {JSX.Element}
 */
const SupportHeader = () => {
  return (
    <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-600 to-blue-700 px-6 py-8 text-white shadow-lg sm:px-8 md:py-10 lg:px-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="max-w-3xl">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur-sm">
            <FaHeadset
              aria-hidden="true"
            />
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
            Centrum pomocy
          </p>

          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Pomoc i kontakt
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-50 sm:text-lg">
            Masz pytanie dotyczące konta, kursu lub działania
            platformy? Opisz swoją sprawę, a nasz zespół
            przeanalizuje zgłoszenie i odpowie tak szybko,
            jak to możliwe.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-80 lg:grid-cols-1">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <FaRegClock
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="font-semibold">
                  Czas odpowiedzi
                </p>

                <p className="mt-1 text-sm leading-5 text-blue-100">
                  Zazwyczaj odpowiadamy w ciągu 2–3 dni roboczych.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <FaShieldAlt
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="font-semibold">
                  Bezpieczne zgłoszenie
                </p>

                <p className="mt-1 text-sm leading-5 text-blue-100">
                  Wiadomość zostanie przypisana do Twojego konta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SupportHeader;