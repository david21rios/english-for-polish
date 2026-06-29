// src/utils/errorHandling.js
export const errorMessages = {
  // Errores de autenticación
  'auth/user-not-found': 'No existe una cuenta con este correo electrónico',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/email-already-in-use': 'Este correo electrónico ya está registrado',
  'auth/invalid-email': 'Correo electrónico inválido',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
  'auth/operation-not-allowed': 'Operación no permitida',
  'auth/popup-closed-by-user': 'Ventana cerrada antes de completar la operación',

  // Errores de Firestore
  'permission-denied': 'No tienes permisos para realizar esta acción',
  'not-found': 'El documento o recurso no existe',
  'already-exists': 'El documento ya existe',
  'failed-precondition': 'La operación fue rechazada',
  'resource-exhausted': 'Cuota excedida o velocidad de solicitudes muy alta',

  // Errores generales
  'network-error': 'Error de conexión. Verifica tu internet',
  'unknown-error': 'Ha ocurrido un error inesperado',
  'invalid-input': 'Datos ingresados inválidos',
  'server-error': 'Error en el servidor'
};

export const handleError = (error) => {
  console.error('Error:', error);

  // Si el error tiene un código específico
  if (error.code) {
    return errorMessages[error.code] || 'Ha ocurrido un error inesperado';
  }

  // Si es un error de red
  if (!navigator.onLine) {
    return errorMessages['network-error'];
  }

  // Error por defecto
  return errorMessages['unknown-error'];
};