// Parte 1: Importaciones, constantes y configuración inicial
/**
 * Respondeme todo en español.

A continuacion te comparto los archivos que contienen todo lo que tengo en mi aplicacion web que estoy creando con React, firebase, tailwind.css, y quiero que me ayudes a mejoararla.

quiero saber si es posible, crear un componente llamado Admin.jsx, que solo el usuario de rol admin (que haya un usuario asignado como admin por default) tenga permiso para agregar o eliminar lecciones. que solo se guarden de estas lecciones en la base de datos los titulos, el id(que cada id sea dependiendo el nivel de la leccion como esta hasta ahora A1_1,A1_2,....,A2_1,A2_2,....,) y el content como lo tengo hasta ahora y el resto de la estructura se agregue a mi codigo.

Por el momento tengo en mi base de datos una collection levels que tiene dentro los niveles A1-C2 y dentro una subcollection lesssons que contiene los datos de las lecciones, id, title, content.
Hay forma de hacer esto?

tambien quiero mejorar mi archivo Nivel.jsx que contenga la estructura base como debe ser. todas mis lecciones desde nivel A1 - C2 tienen la siguiente estructrua. y quiero actualizar mi Nivel.jsx con esta estructura
objetivos: ,
  contenidos: ,
  actividades: ,
  lectura: ,
  practica_interactiva: ,
  produccion_escrita: ,
  produccion_oral: ,
  ejercicios_interactivos: ,
  evaluacion: ,
  recursos_adicionales: ,
  reflexion_final: 
 * 
 * quiero mejorar mi archivo Nivel.jsx que contenga la estructura base como debe ser. todas mis lecciones desde nivel A1 - C2 tienen la siguiente estructrua. y quiero actualizar mi Nivel.jsx con esta estructura objetivos: , contenidos: , actividades: , lectura: , practica_interactiva: , produccion_escrita: , produccion_oral: , ejercicios_interactivos: , evaluacion: , recursos_adicionales: , reflexion_final:
 * 
 * 
 */
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { getLessonsByLevel } from "../services/firestoreService";
import { getLessonContent } from "../utils/lessonUtils";
import AudioPlayer from '../components/interactive/AudioPlayer';
import AudioRecorder from '../components/interactive/AudioRecorder';
import InteractiveQuiz from '../components/interactive/InteractiveQuiz';
import InteractivePractice from '../components/interactive/InteractivePractice';
import PresentationsForum from '../components/interactive/PresentationsForum';
import {
  FaBook,
  FaClipboardList,
  FaGraduationCap,
  FaBookReader,
  FaPencilAlt,
  FaLink,
  FaListAlt,
  FaUserGraduate,
  FaBookOpen,
  FaLightbulb,
  FaChevronUp
} from "react-icons/fa";

const LEVEL_SECTIONS = {
  A1: ['objetivos', 'contenidos', 'actividades', 'lectura', 'practica_interactiva', 'evaluacion', 'recursos_adicionales', 'reflexion_final'],
  A2: ['objetivos', 'contenidos', 'actividades', 'lectura', 'practica_interactiva', 'evaluacion', 'recursos_adicionales', 'reflexion_final'],
  B1: ['objetivos', 'contenidos', 'actividades', 'lectura', 'practica_interactiva', 'evaluacion', 'recursos_adicionales', 'reflexion_final'],
  B2: ['objetivos', 'contenidos', 'actividades', 'lectura_comprension', 'practica_interactiva', 'evaluacion', 'recursos_adicionales', 'reflexion_final'],
  C1: ['objetivos', 'contenidos', 'lectura', 'produccion_escrita', 'produccion_oral', 'evaluacion', 'recursos_adicionales', 'ejercicios_interactivos'],
  C2: ['objetivos', 'contenidos', 'lectura', 'produccion_escrita', 'produccion_oral', 'evaluacion', 'ejercicios_interactivos', 'recursos_adicionales']
};

const Nivel = () => {
  const { levelId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonDetails, setLessonDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const navigate = useNavigate();
  const contentRef = useRef(null);

  // Función para ordenar lecciones
  const sortLessons = (lessons) => {
    return [...lessons].sort((a, b) => {
      const numA = parseInt(a.id.split('_')[1]);
      const numB = parseInt(b.id.split('_')[1]);
      return numA - numB;
    });
  };

  // Función para obtener lecciones
  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      const levelLessons = await getLessonsByLevel(levelId);
      const sortedLessons = sortLessons(levelLessons); // Ordena las lecciones
      setLessons(sortedLessons);

      if (sortedLessons.length > 0) {
        const firstLesson = sortedLessons[0];
        const lessonContent = getLessonContent(levelId, firstLesson.id);
        setCurrentLesson(firstLesson);
        setLessonDetails(lessonContent);
      }
    } catch (error) {
      setError("Error al cargar las lecciones");
      console.error("Error en fetchLessons:", error);
    } finally {
      setLoading(false);
    }
  }, [levelId]);

  // El useEffect puede permanecer igual
  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Función para manejar el cambio de lección
  const handleLessonChange = (lessonId) => {
    const selectedLesson = lessons.find(lesson => lesson.id === lessonId);
    setCurrentLesson(selectedLesson);
    const lessonContent = getLessonContent(levelId, lessonId);
    setLessonDetails(lessonContent);
    setCurrentSection(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600 bg-red-100 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  const renderValue = (value) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <ul className="list-disc pl-4">
          {Object.entries(value).map(([k, v], i) => (
            <li key={i} className="text-gray-600">
              <span className="font-medium">{k}:</span>{" "}
              {typeof v === 'object' ? renderValue(v) : v}
            </li>
          ))}
        </ul>
      );
    }
    return value;
  };

  // Función para obtener el siguiente nivel
  const getNextLevel = (currentLevel) => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  // Funciones para navegación entre lecciones
  const handleNextLesson = () => {
    const currentIndex = lessons.findIndex(lesson => lesson.id === currentLesson.id);
    if (currentIndex < lessons.length - 1) {
      handleLessonChange(lessons[currentIndex + 1].id);
    } else if (getNextLevel(levelId)) {
      navigate(`/curso/${getNextLevel(levelId)}`);
    }
  };

  const handlePreviousLesson = () => {
    const currentIndex = lessons.findIndex(lesson => lesson.id === currentLesson.id);
    if (currentIndex > 0) {
      handleLessonChange(lessons[currentIndex - 1].id);
    }
  };

  // Continúa en la siguiente parte...
  // Parte 2: Componentes de sección y animaciones

  // Componente para el menú de navegación rápida
  const QuickNavMenu = ({ sections, currentSection, onSectionClick }) => {
    return (
      <nav className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50">
        <div className="bg-white rounded-lg shadow-lg p-2">
          {sections.map((section, index) => (
            <button
              key={index}
              onClick={() => onSectionClick(index)}
              className={`w-3 h-3 rounded-full m-2 transition-all duration-300 ${currentSection === index
                ? "bg-primary-600 scale-125"
                : "bg-gray-300 hover:bg-primary-400"
                }`}
              title={section.replace("_", " ").toUpperCase()}
            />
          ))}
        </div>
      </nav>
    );
  };

  // Componente para el indicador de progreso
  const ProgressIndicator = ({ current, total }) => {
    const progress = (current / total) * 100;

    return (
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <motion.div
          className="h-full bg-primary-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    );
  };

  // Componente para el botón de volver arriba
  const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      };

      window.addEventListener("scroll", toggleVisibility);
      return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    };

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
          >
            <FaChevronUp />
          </motion.button>
        )}
      </AnimatePresence>
    );
  };

  // Componente para renderizar secciones con animación
  const AnimatedSection = ({ children, index, currentSection }) => {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: currentSection === index ? 1 : 0.98
        }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-sm p-6 transition-all"
      >
        {children}
      </motion.section>
    );
  };

  // Componente para el contenido de la lección
  const LessonContent = ({ section, content, levelId, lessonDetails, currentLesson }) => {
    switch (section) {
      case 'objetivos':
        return (
          <>
            <div className="flex items-center gap-2 mb-4">
              <FaClipboardList className="text-primary-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Objetivos</h2>
            </div>
            <ul className="space-y-2">
              {Array.isArray(content) ? content.map((objetivo, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary-600">•</span>
                  <span>{objetivo}</span>
                </li>
              )) : <li>Objetivos no disponibles</li>}
            </ul>
          </>
        );
      case 'contenidos':
        return (
          <>
            <div className="flex items-center gap-2 mb-6">
              <FaBook className="text-primary-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Contenido</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Vocabulario</h3>
                {lessonDetails?.contenidos?.vocabulario && Object.entries(lessonDetails.contenidos.vocabulario).map(([categoria, palabras], idx) => (
                  <div key={idx} className="mb-4">
                    <h4 className="font-medium text-primary-600 mb-2">{categoria}</h4>
                    <ul className="space-y-1">
                      {Array.isArray(palabras) ? palabras.map((palabra, i) => (
                        <li key={i} className="flex items-center justify-between text-gray-600">
                          <span>{typeof palabra === 'string' ? palabra : `${palabra.termino}: ${palabra.definicion}`}</span>
                          <AudioPlayer label="Escuchar" />
                        </li>
                      )) : <li className="text-gray-600">No hay palabras disponibles</li>}
                    </ul>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Gramática</h3>
                {lessonDetails?.contenidos?.gramatica && Object.entries(lessonDetails.contenidos.gramatica).map(([concepto, valor], idx) => (
                  <div key={idx} className="mb-4">
                    <h4 className="font-medium text-primary-600 mb-2">{concepto}</h4>
                    <div className="text-gray-600">
                      {typeof valor === "object" ? (
                        <div className="pl-4">
                          {Object.entries(valor).map(([key, v], i) => (
                            <div key={i} className="mb-2">
                              <span className="font-medium">{key}:</span> {renderValue(v)}
                            </div>
                          ))}
                        </div>
                      ) : <p>{valor}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      case 'actividades':
        return (
          <>
            <div className="flex items-center gap-2 mb-6">
              <FaPencilAlt className="text-primary-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Actividades</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {lessonDetails?.actividades?.map((actividad, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-primary-600 mb-2">{actividad.nombre}</h3>
                  <p className="text-gray-600 mb-3">{actividad.descripcion}</p>
                  {actividad.ejercicio && (
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-700 mb-1">Ejercicio:</p>
                      <p className="text-gray-600">{actividad.ejercicio}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        );
      case 'foro':
        return (
          <>
            <div className="flex items-center gap-2 mb-6">
              <FaUserGraduate className="text-primary-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Foro de Presentaciones</h2>
            </div>
            <PresentationsForum levelId={levelId} lessonId={currentLesson?.id} />
          </>
        );
      case 'lectura':
        return (
          <>
            <div className="flex items-center gap-2 mb-6">
              <FaBookReader className="text-primary-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Lectura</h2>
            </div>
            {lessonDetails?.lectura ? (
              <div className="prose max-w-none">
                <h3 className="text-xl font-medium text-gray-900 mb-2">{lessonDetails.lectura.titulo}</h3>
                <p className="text-gray-600 italic mb-4">Por: {lessonDetails.lectura.autor}</p>
                <div className="bg-gray-50 p-6 rounded-lg text-gray-700 leading-relaxed">
                  {lessonDetails.lectura.contenido}
                </div>
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Practica tu lectura:</h4>
                  <AudioRecorder onRecordingComplete={(blob) => console.log('Grabación de lectura completada:', blob)} />
                </div>
              </div>
            ) : <p className="text-gray-500">Lectura no disponible</p>}
          </>
        );
      case 'practica_interactiva':
        return (
          <>
            <div className="flex items-center gap-2 mb-6">
              <FaGraduationCap className="text-primary-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Práctica Interactiva</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-primary-600 mb-3">{lessonDetails?.practica_interactiva?.titulo}</h3>
                <p className="text-gray-600 mb-4">{lessonDetails?.practica_interactiva?.descripcion}</p>
                <InteractivePractice exercises={lessonDetails?.practica_interactiva?.ejercicios || []} />
              </div>
            </div>
          </>
        );
      case 'evaluacion':
        return (
          <>
            <div className="flex items-center gap-2 mb-6">
              <FaListAlt className="text-primary-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Evaluación</h2>
            </div>
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-primary-600 mb-2">Autoevaluación</h3>
                <p className="text-gray-600">{lessonDetails?.evaluacion?.autoevaluacion}</p>
                <AudioRecorder onRecordingComplete={(blob) => console.log('Grabación completada:', blob)} />
              </div>
              {lessonDetails?.evaluacion?.cuestionario && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-primary-600 mb-3">Cuestionario</h3>
                  <InteractiveQuiz questions={lessonDetails.evaluacion.cuestionario} />
                </div>
              )}
            </div>
          </>
        );
      case 'recursos_adicionales':
        return (
          <>
            <div className="flex items-center gap-2 mb-6">
              <FaLink className="text-primary-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Recursos Adicionales</h2>
            </div>
            <ul className="space-y-3">
              {lessonDetails?.recursos_adicionales?.map((recurso, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <FaBookOpen className="text-primary-500" />
                  <span className="font-medium text-gray-700">{recurso.nombre}:</span>
                  <a href={recurso.enlace} className="text-primary-600 hover:text-primary-700 underline" target="_blank" rel="noopener noreferrer">
                    {recurso.enlace}
                  </a>
                </li>
              ))}
            </ul>
          </>
        );
      case 'reflexion_final':
        return (
          <>
            <div className="flex items-center gap-2 mb-6">
              <FaLightbulb className="text-primary-600 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Reflexión Final</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">{lessonDetails?.reflexion_final}</p>
          </>
        );
      default:
        return null;
    }
  };

  // Animaciones para transiciones de página
  const pageTransition = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3 }
  };

  // Continúa en la siguiente parte con el componente principal y el renderizado...
  // Parte 3: Componente principal y renderizado

  return (
    //utilizar motion de manera correcta
    <motion.div
      className="flex min-h-screen bg-gray-50"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
    >
      {/* Indicador de progreso */}
      <ProgressIndicator
        current={currentSection}
        total={LEVEL_SECTIONS[levelId].length}
      />

      {/* Sidebar con lista de lecciones */}
      <div className="w-64 bg-white shadow-lg overflow-y-auto fixed h-full">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-primary-600">
            Nivel {levelId}
          </h2>
        </div>
        <nav className="p-2">
          {lessons.map((lesson) => (
            <motion.button
              key={lesson.id}
              onClick={() => handleLessonChange(lesson.id)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 ${currentLesson?.id === lesson.id
                ? "bg-primary-100 text-primary-600"
                : "hover:bg-gray-100"
                }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {lesson.title || lesson.titulo}
            </motion.button>
          ))}
        </nav>
      </div>

      {/* Menú de navegación rápida */}
      <QuickNavMenu
        sections={LEVEL_SECTIONS[levelId]}
        currentSection={currentSection}
        onSectionClick={(index) => {
          setCurrentSection(index);
          const element = document.getElementById(`section-${index}`);
          element?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Contenido principal */}
      <div className="ml-64 flex-1 p-8" ref={contentRef}>
        {currentLesson && lessonDetails ? (
          <motion.div
            className="max-w-4xl mx-auto space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Título de la lección */}
            <motion.header
              className="text-center"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {lessonDetails.titulo}
              </h1>
            </motion.header>

            {/* Renderizado dinámico de secciones */}
            {LEVEL_SECTIONS[levelId].map((sectionType, index) => (
              <AnimatedSection
                key={sectionType}
                index={index}
                currentSection={currentSection}
              >
                <div id={`section-${index}`}>
                  <LessonContent
                    section={sectionType}
                    content={lessonDetails[sectionType]}
                    levelId={levelId}
                  />
                </div>
              </AnimatedSection>
            ))}

            {/* Botones de navegación */}
            <motion.div
              className="flex justify-between mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                onClick={handlePreviousLesson}
                disabled={lessons.findIndex(lesson => lesson.id === currentLesson.id) === 0}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-300 
                ${lessons.findIndex(lesson => lesson.id === currentLesson.id) === 0
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Lección anterior
              </motion.button>

              <motion.button
                onClick={handleNextLesson}
                className="px-6 py-3 rounded-lg font-semibold text-white transition-colors duration-300
                bg-primary-500 hover:bg-primary-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {lessons.findIndex(lesson => lesson.id === currentLesson.id) === lessons.length - 1
                  ? getNextLevel(levelId)
                    ? `Ir al nivel ${getNextLevel(levelId)} →`
                    : 'Curso completado'
                  : 'Siguiente lección →'
                }
              </motion.button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500 text-lg">
              Selecciona una lección para ver su contenido
            </p>
          </div>
        )}
      </div>

      {/* Botón de volver arriba */}
      <ScrollToTopButton />
    </motion.div>
  );
};

export default Nivel;