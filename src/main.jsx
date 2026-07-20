import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import ErrorBoundary from "./components/shared/ErrorMessage";

import App from "./App";

import "./index.css";

/**
 * Removes the splash screen after
 * the application has been rendered.
 */
const removeSplashScreen = () => {
  const splashScreen =
    document.getElementById(
      "splash-screen"
    );

  if (!splashScreen) {
    return;
  }

  splashScreen.style.opacity = "0";

  setTimeout(() => {
    splashScreen.remove();
  }, 300);
};

/**
 * Registers global browser error handlers.
 */
const registerGlobalErrorHandlers = () => {
  window.addEventListener(
    "unhandledrejection",
    (event) => {
      console.error(
        "Unhandled promise rejection:",
        event.reason
      );
    }
  );

  window.addEventListener(
    "error",
    (event) => {
      console.error(
        "Unhandled application error:",
        event.error
      );
    }
  );
};

/**
 * Displays a fatal initialization error.
 *
 * @param {HTMLElement} rootElement
 */
const renderFatalError = (
  rootElement
) => {
  rootElement.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">

      <div class="max-w-lg text-center p-8">

        <h1 class="text-3xl font-bold text-red-600 mb-4">

          Nie udało się uruchomić aplikacji

        </h1>

        <p class="text-gray-600 leading-relaxed">

          Podczas uruchamiania aplikacji wystąpił nieoczekiwany błąd.
          Odśwież stronę i spróbuj ponownie.

        </p>

        <button
          onclick="window.location.reload()"
          class="mt-6 rounded-lg bg-primary-600 px-6 py-3 text-white hover:bg-primary-700 transition-colors"
        >

          Odśwież stronę

        </button>

      </div>

    </div>
  `;
};

/**
 * Bootstraps the React application.
 */
const bootstrapApplication = () => {
  const rootElement =
    document.getElementById(
      "root"
    );

  if (!rootElement) {
    throw new Error(
      "Root element not found."
    );
  }

  try {
    const root =
      createRoot(rootElement);

    root.render(
      <StrictMode>

        <ErrorBoundary>

          <BrowserRouter>


              <App />


          </BrowserRouter>

        </ErrorBoundary>

      </StrictMode>
    );

    removeSplashScreen();

    registerGlobalErrorHandlers();

  } catch (error) {

    console.error(
      "Application bootstrap failed:",
      error
    );

    renderFatalError(rootElement);

  }
};

bootstrapApplication();

if (import.meta.hot) {
  import.meta.hot.accept();
}