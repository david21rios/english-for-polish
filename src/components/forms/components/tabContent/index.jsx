// src/components/forms/components/tabContent/index.jsx

import PropTypes from "prop-types";

import BasicInfo from "../BasicInfo";
import Contents from "../Contents";
import Evaluation from "../Evaluation";
import InteractivePractice from "../InteractivePractice.jsx";
import Objectives from "../Objectives";
import OralProduction from "../OralProduction";
import Reading from "../Reading";
import Reflection from "../Reflection";
import Resources from "../Resources";
import WritingProduction from "../WritingProduction";

const COMPONENTS_MAP = {
  basic: BasicInfo,
  objectives: Objectives,
  contents: Contents,
  reading: Reading,
  practice: InteractivePractice,
  writing: WritingProduction,
  speaking: OralProduction,
  evaluation: Evaluation,
  resources: Resources,
  reflection: Reflection,

  // Legacy tab keys during migration.
  objetivos: Objectives,
  contenidos: Contents,
  lectura: Reading,
  practica: InteractivePractice,
  produccion_escrita: WritingProduction,
  produccion_oral: OralProduction,
  evaluacion: Evaluation,
  recursos: Resources,
  reflexion: Reflection,

  // Transitional keys if any older component still sends these.
  writingProduction: WritingProduction,
  oralProduction: OralProduction
};

const TabContent = ({
  activeTab,
  formData,
  setFormData,
  errors = {},
  isEditing = false
}) => {
  const Component = COMPONENTS_MAP[activeTab];

  if (!Component) {
    console.warn(`Tab "${activeTab}" not found.`);
    return null;
  }

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

TabContent.propTypes = {
  activeTab: PropTypes.oneOf(Object.keys(COMPONENTS_MAP)).isRequired,
  formData: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  errors: PropTypes.object,
  isEditing: PropTypes.bool
};

export default TabContent;