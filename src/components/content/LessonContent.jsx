// src/components/content/LessonContent.jsx
import React from 'react';
import PropTypes from 'prop-types';

// Componentes auxiliares para mejor organización
const SectionTitle = ({ children }) => (
  <h4 className="text-lg font-semibold text-gray-900 mb-3">{children}</h4>
);

const EmptyMessage = ({ message }) => (
  <p className="text-gray-500 italic">{message || 'No hay contenido disponible'}</p>
);

const ContentSection = ({ title, children, isEmpty, emptyMessage }) => (
  <section className="mb-6">
    <SectionTitle>{title}</SectionTitle>
    {isEmpty ? <EmptyMessage message={emptyMessage} /> : children}
  </section>
);

const LessonContent = ({ lesson }) => {
  if (!lesson) return null;

  const safeArray = (arr) => Array.isArray(arr) ? arr : [];
  const safeObject = (obj) => obj && typeof obj === 'object' ? obj : {};

  // Componente para objetivos
  const Objetivos = () => (
    <ContentSection
      title="Objetivos"
      isEmpty={!safeArray(lesson.objetivos).length}
      emptyMessage="No hay objetivos definidos"
    >
      <ul className="list-disc pl-5 space-y-2">
        {safeArray(lesson.objetivos).map((objetivo, index) => (
          <li key={index} className="text-gray-700">{objetivo}</li>
        ))}
      </ul>
    </ContentSection>
  );

  // Componente para contenidos
  const Contenidos = () => {
    const vocabulario = safeObject(lesson.contenidos?.vocabulario);
    const gramatica = safeObject(lesson.contenidos?.gramatica);

    return (
      <ContentSection title="Contenidos">
        {/* Vocabulario */}
        <div className="mb-6">
          <h5 className="text-md font-medium text-gray-800 mb-2">Vocabulario</h5>
          {Object.keys(vocabulario).length > 0 ? (
            Object.entries(vocabulario).map(([categoria, palabras]) => (
              <div key={categoria} className="ml-4 mb-3">
                <h6 className="font-medium text-gray-700 mb-2">{categoria}</h6>
                <ul className="list-disc pl-5 space-y-1">
                  {safeArray(palabras).map((palabra, idx) => (
                    <li key={idx} className="text-gray-600">
                      {typeof palabra === 'string'
                        ? palabra
                        : `${palabra?.termino || ''}: ${palabra?.definicion || ''}`}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <EmptyMessage message="No hay vocabulario definido" />
          )}
        </div>

        {/* Gramática */}
        <div>
          <h5 className="text-md font-medium text-gray-800 mb-2">Gramática</h5>
          {Object.keys(gramatica).length > 0 ? (
            Object.entries(gramatica).map(([concepto, valor]) => (
              <div key={concepto} className="ml-4 mb-3">
                <h6 className="font-medium text-gray-700 mb-2">{concepto}</h6>
                <div className="text-gray-600 ml-4">
                  {typeof valor === 'string' ? (
                    <p>{valor}</p>
                  ) : (
                    Object.entries(valor || {}).map(([k, v], i) => (
                      <div key={i} className="mb-1">
                        <span className="font-medium">{k}:</span> {String(v)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          ) : (
            <EmptyMessage message="No hay contenido gramático definido" />
          )}
        </div>
      </ContentSection>
    );
  };

  // Componente para actividades
  const Actividades = () => (
    <ContentSection
      title="Actividades"
      isEmpty={!safeArray(lesson.actividades).length}
      emptyMessage="No hay actividades definidas"
    >
      <div className="space-y-4">
        {safeArray(lesson.actividades).map((actividad, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg shadow-sm">
            <h5 className="font-medium text-gray-800 mb-2">{actividad?.nombre}</h5>
            <p className="text-gray-600 mb-2">{actividad?.descripcion}</p>
            {actividad?.ejercicios && (
              <div className="mt-2">
                <h6 className="font-medium text-gray-700">Ejercicios:</h6>
                <ul className="list-disc pl-5 mt-2">
                  {safeArray(actividad.ejercicios).map((ejercicio, i) => (
                    <li key={i} className="text-gray-600">{ejercicio}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </ContentSection>
  );

  // Componente para lectura
  const Lectura = () => (
    <ContentSection
      title="Lectura"
      isEmpty={!lesson.lectura}
      emptyMessage="No hay lectura disponible"
    >
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h5 className="font-medium text-gray-800 mb-2">{lesson.lectura.titulo}</h5>
        <p className="text-gray-600 italic mb-3">Autor: {lesson.lectura.autor}</p>
        <div className="text-gray-600 whitespace-pre-line">{lesson.lectura.contenido}</div>
        {safeArray(lesson.lectura.preguntas).length > 0 && (
          <div className="mt-4">
            <h6 className="font-medium text-gray-700 mb-2">Preguntas de comprensión:</h6>
            <ul className="list-decimal pl-5 space-y-2">
              {lesson.lectura.preguntas.map((pregunta, idx) => (
                <li key={idx} className="text-gray-600">{pregunta}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ContentSection>
  );

  // Continuación del componente LessonContent...

  // Componente para práctica interactiva
  const PracticaInteractiva = () => (
    <ContentSection
      title="Práctica Interactiva"
      isEmpty={!lesson.practica_interactiva}
      emptyMessage="No hay práctica interactiva disponible"
    >
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h5 className="font-medium text-gray-800 mb-2">{lesson.practica_interactiva.titulo}</h5>
        <p className="text-gray-600 mb-3">{lesson.practica_interactiva.descripcion}</p>
        {safeArray(lesson.practica_interactiva.ejercicios).length > 0 && (
          <div className="space-y-3">
            {lesson.practica_interactiva.ejercicios.map((ejercicio, idx) => (
              <div key={idx} className="border-t pt-3">
                <p className="font-medium text-gray-700">{ejercicio.pregunta}</p>
                {ejercicio.tipo === 'seleccion_multiple' && (
                  <ul className="mt-2 pl-5 space-y-1">
                    {safeArray(ejercicio.opciones).map((opcion, i) => (
                      <li key={i} className="text-gray-600">• {opcion}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ContentSection>
  );

  // Componente para producción escrita
  const ProduccionEscrita = () => (
    <ContentSection
      title="Producción Escrita"
      isEmpty={!lesson.produccion_escrita}
      emptyMessage="No hay ejercicios de producción escrita disponibles"
    >
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h5 className="font-medium text-gray-800 mb-2">{lesson.produccion_escrita.titulo}</h5>
        <p className="text-gray-600 mb-3">{lesson.produccion_escrita.descripcion}</p>
        {safeArray(lesson.produccion_escrita.ejercicios).length > 0 && (
          <div className="space-y-3">
            {lesson.produccion_escrita.ejercicios.map((ejercicio, idx) => (
              <div key={idx} className="border-t pt-3">
                <p className="text-gray-600">{ejercicio}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ContentSection>
  );

  // Componente para producción oral
  const ProduccionOral = () => (
    <ContentSection
      title="Producción Oral"
      isEmpty={!lesson.produccion_oral}
      emptyMessage="No hay ejercicios de producción oral disponibles"
    >
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h5 className="font-medium text-gray-800 mb-2">{lesson.produccion_oral.titulo}</h5>
        <p className="text-gray-600 mb-3">{lesson.produccion_oral.descripcion}</p>
        {safeArray(lesson.produccion_oral.ejercicios).length > 0 && (
          <div className="space-y-3">
            {lesson.produccion_oral.ejercicios.map((ejercicio, idx) => (
              <div key={idx} className="border-t pt-3">
                <p className="text-gray-600">{ejercicio}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ContentSection>
  );

  // En el componente EjerciciosInteractivos, modifica la sección donde se renderizan los ejercicios:

  const EjerciciosInteractivos = () => (
    <ContentSection
      title="Ejercicios Interactivos"
      isEmpty={!lesson.ejercicios_interactivos}
      emptyMessage="No hay ejercicios interactivos disponibles"
    >
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h5 className="font-medium text-gray-800 mb-2">
          {lesson.ejercicios_interactivos.titulo}
        </h5>
        <p className="text-gray-600 mb-3">
          {lesson.ejercicios_interactivos.descripcion}
        </p>
        {safeArray(lesson.ejercicios_interactivos.ejercicios).length > 0 && (
          <div className="space-y-3">
            {lesson.ejercicios_interactivos.ejercicios.map((ejercicio, idx) => (
              <div key={idx} className="border-t pt-3">
                <h6 className="font-medium text-gray-700 mb-2">
                  {ejercicio.pregunta || 'Sin pregunta'}
                </h6>
                {ejercicio.tipo === 'seleccion_multiple' && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Opciones:</p>
                    <ul className="list-disc pl-5">
                      {safeArray(ejercicio.opciones).map((opcion, i) => (
                        <li key={i} className="text-gray-600">{opcion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {ejercicio.tipo === 'completar' && (
                  <div>
                    <p className="text-sm text-gray-600">Texto: {ejercicio.texto}</p>
                    {ejercicio.palabras && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Palabras:</p>
                        <div className="flex gap-2 flex-wrap">
                          {ejercicio.palabras.map((palabra, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 rounded">
                              {palabra}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {ejercicio.tipo === 'ordenar' && (
                  <div>
                    <p className="text-sm text-gray-600">Elementos a ordenar:</p>
                    <ul className="list-disc pl-5">
                      {safeArray(ejercicio.elementos).map((elemento, i) => (
                        <li key={i} className="text-gray-600">{elemento}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {ejercicio.tipo === 'relacionar' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Columna A:</p>
                      <ul className="list-disc pl-5">
                        {safeArray(ejercicio.pares_izquierda).map((item, i) => (
                          <li key={i} className="text-gray-600">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Columna B:</p>
                      <ul className="list-disc pl-5">
                        {safeArray(ejercicio.pares_derecha).map((item, i) => (
                          <li key={i} className="text-gray-600">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ContentSection>
  );

  // Componente para evaluación
  const Evaluacion = () => (
    <ContentSection
      title="Evaluación"
      isEmpty={!lesson.evaluacion}
      emptyMessage="No hay evaluación disponible"
    >
      <div className="space-y-4">
        {/* Autoevaluación */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h5 className="font-medium text-gray-800 mb-2">Autoevaluación</h5>
          <p className="text-gray-600">{lesson.evaluacion.autoevaluacion}</p>
        </div>

        {/* Cuestionario */}
        {safeArray(lesson.evaluacion.cuestionario).length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h5 className="font-medium text-gray-800 mb-3">Cuestionario</h5>
            <div className="space-y-4">
              {lesson.evaluacion.cuestionario.map((pregunta, idx) => (
                <div key={idx} className="border-b pb-3">
                  <p className="font-medium text-gray-700 mb-2">{pregunta.pregunta}</p>
                  <ul className="pl-5 space-y-1">
                    {safeArray(pregunta.opciones).map((opcion, i) => (
                      <li key={i} className="text-gray-600">• {opcion}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ContentSection>
  );

  // Componente para recursos adicionales
  const RecursosAdicionales = () => (
    <ContentSection
      title="Recursos Adicionales"
      isEmpty={!safeArray(lesson.recursos_adicionales).length}
      emptyMessage="No hay recursos adicionales disponibles"
    >
      <div className="space-y-3">
        {safeArray(lesson.recursos_adicionales).map((recurso, idx) => (
          <div key={idx} className="bg-white p-4 rounded-lg shadow-sm">
            <h5 className="font-medium text-gray-800 mb-1">{recurso.nombre}</h5>
            <p className="text-gray-600 mb-2">{recurso.descripcion}</p>
            <a
              href={recurso.enlace}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              {recurso.enlace}
            </a>
          </div>
        ))}
      </div>
    </ContentSection>
  );

  // Componente para reflexión final
  const ReflexionFinal = () => (
    lesson.reflexion_final && (
      <ContentSection title="Reflexión Final">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-gray-600">{lesson.reflexion_final}</p>
        </div>
      </ContentSection>
    )
  );

  return (
    <div className="mt-4 border-t pt-4">
      <div className="bg-gray-50 p-6 rounded-lg space-y-6">
        <Objetivos />
        <Contenidos />
        <Actividades />
        <Lectura />
        <PracticaInteractiva />
        <ProduccionEscrita />
        <ProduccionOral />
        <EjerciciosInteractivos />
        <Evaluacion />
        <RecursosAdicionales />
        <ReflexionFinal />
      </div>
    </div>
  );
};

// Añadir más PropTypes según sea necesario
LessonContent.propTypes = {
  lesson: PropTypes.shape({
    objetivos: PropTypes.arrayOf(PropTypes.string),
    contenidos: PropTypes.object,
    actividades: PropTypes.array,
    lectura: PropTypes.object,
    practica_interactiva: PropTypes.object,
    produccion_escrita: PropTypes.object,
    produccion_oral: PropTypes.object,
    ejercicios_interactivos: PropTypes.object,
    evaluacion: PropTypes.object,
    recursos_adicionales: PropTypes.array,
    reflexion_final: PropTypes.string
  })
};

export default LessonContent;