// components/forms/components/tabContent/index.jsx
import React from 'react';
import PropTypes from 'prop-types'; // Añadimos PropTypes para validación
import BasicInfo from '../BasicInfo';
import Objectives from '../Objectives';
import Contents from '../Contents';
import Reading from '../Reading';
import InteractivePractice from '../InteractivePractice.jsx';
import WritingProduction from '../WritingProduction';
import OralProduction from '../OralProduction';
import Evaluation from '../Evaluation';
import Resources from '../Resources';
import Reflection from '../Reflection';

// Objeto con los componentes mapeados
const COMPONENTS_MAP = {
  basic: BasicInfo,
  objetivos: Objectives,
  contenidos: Contents,
  lectura: Reading,
  practica: InteractivePractice,
  produccion_escrita: WritingProduction,
  produccion_oral: OralProduction,
  evaluacion: Evaluation,
  recursos: Resources,
  reflexion: Reflection
};

const TabContent = ({ activeTab, formData, setFormData, errors, isEditing }) => {
  // Validamos que el activeTab exista en nuestro mapa de componentes
  if (!COMPONENTS_MAP[activeTab]) {
    console.warn(`Tab "${activeTab}" no encontrado`);
    return null;
  }

  const Component = COMPONENTS_MAP[activeTab];

  return (
    <div className="mt-6">
      <Component
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        isEditing={isEditing}
      />
    </div>
  );
};

// Definimos PropTypes para validación de props
TabContent.propTypes = {
  activeTab: PropTypes.oneOf(Object.keys(COMPONENTS_MAP)).isRequired,
  formData: PropTypes.shape({
    id: PropTypes.string,
    titulo: PropTypes.string,
    descripcion: PropTypes.string,
    objetivos: PropTypes.array,
    contenidos: PropTypes.shape({
      vocabulario: PropTypes.object,
      gramatica: PropTypes.object
    }),
    lectura: PropTypes.object,
    practica_interactiva: PropTypes.object,
    produccion_escrita: PropTypes.object,
    produccion_oral: PropTypes.object,
    evaluacion: PropTypes.object,
    recursos_adicionales: PropTypes.array,
    reflexion_final: PropTypes.string
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  errors: PropTypes.object,
  isEditing: PropTypes.bool
};

// Valores por defecto para props opcionales
TabContent.defaultProps = {
  errors: {},
  isEditing: false
};

export default TabContent;