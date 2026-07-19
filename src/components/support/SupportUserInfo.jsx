// src/components/support/SupportUserInfo.jsx

import {
  FaEnvelope,
  FaIdBadge,
  FaUserCheck
} from "react-icons/fa";

/**
 * Displays the authenticated user information
 * associated with the support ticket.
 *
 * @param {{
 *   displayName?: string,
 *   email?: string,
 *   uid?: string
 * }} props
 * @returns {JSX.Element}
 */
const SupportUserInfo = ({
  displayName = "",
  email = "",
  uid = ""
}) => {

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Twoje konto
        </h2>

        <p className="mt-2 text-gray-600 leading-7">
          To zgłoszenie zostanie automatycznie
          przypisane do Twojego konta użytkownika.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">

        {/* Display Name */}

        <div className="rounded-xl bg-gray-50 p-4">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <FaUserCheck
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Użytkownik
              </p>

              <p className="truncate text-gray-900 font-medium">
                {
                  displayName ||
                  "Nie podano"
                }
              </p>

            </div>

          </div>

        </div>

        {/* Email */}

        <div className="rounded-xl bg-gray-50 p-4">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <FaEnvelope
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0">

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                E-mail
              </p>

              <p className="truncate text-gray-900 font-medium">
                {
                  email ||
                  "-"
                }
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* Ticket information */}

      <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50 p-5">

        <div className="flex gap-3">

          <div className="mt-1 text-primary-600">
            <FaIdBadge
              aria-hidden="true"
            />
          </div>

          <div>

            <h3 className="font-semibold text-primary-900">
              Informacje o zgłoszeniu
            </h3>

            <p className="mt-2 text-sm leading-6 text-primary-800">

              Po wysłaniu wiadomości nasze
              centrum wsparcia automatycznie
              zapisze identyfikator Twojego konta.

            </p>

            {
              uid && (

                <p className="mt-3 break-all rounded-lg bg-white px-3 py-2 text-xs font-mono text-gray-600">

                  UID: {uid}

                </p>

              )
            }

          </div>

        </div>

      </div>

    </section>
  );

};

export default SupportUserInfo;