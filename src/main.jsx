// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LessonProvider } from './context/lessonContext';
import ErrorBoundary from './components/shared/ErrorMessage';
import App from './App';
import './index.css';

// Configuración para React 19
const appRoot = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    throw new Error('No se encontró el elemento root en el DOM');
  }

  try {
    const root = createRoot(rootElement);

    // Función de limpieza para el splash screen
    const removeSplashScreen = () => {
      const splashScreen = document.getElementById('splash-screen');
      if (splashScreen) {
        splashScreen.style.opacity = '0';
        setTimeout(() => splashScreen.remove(), 300);
      }
    };

    // Renderizar la aplicación
    root.render(
      <StrictMode>
        <ErrorBoundary fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center p-4">
              <h1 className="text-2xl text-red-600 mb-2">
                Algo salió mal
              </h1>
              <p className="text-gray-600">
                Por favor, recarga la página o intenta más tarde.
              </p>
            </div>
          </div>
        }>
          <BrowserRouter>
            <LessonProvider>
              <App />
            </LessonProvider>
          </BrowserRouter>
        </ErrorBoundary>
      </StrictMode>
    );

    // Eliminar el splash screen después del renderizado
    removeSplashScreen();

    // Configurar manejador de errores global
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Error no manejado:', event.reason);
    });

  } catch (error) {
    console.error('Error al inicializar la aplicación:', error);

    // Mostrar error con Tailwind CSS
    rootElement.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="text-center p-8">
          <h1 class="text-2xl font-bold text-red-600 mb-4">
            Error al cargar la aplicación
          </h1>
          <p class="text-gray-600">
            Por favor, recarga la página o intenta más tarde.
          </p>
          <button 
            onclick="window.location.reload()" 
            class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Recargar página
          </button>
        </div>
      </div>
    `;
  }
};

// Iniciar la aplicación
appRoot();

// Habilitar HMR (Hot Module Replacement) para desarrollo
if (import.meta.hot) {
  import.meta.hot.accept();
}