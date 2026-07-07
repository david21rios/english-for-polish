// src/components/forms/components/TabNavigation/index.jsx

import PropTypes from "prop-types";

const TabNavigation = ({
  tabs,
  activeTab,
  setActiveTab
}) => {
  return (
    <div className="border-b border-gray-200 overflow-x-auto">
      <nav
        className="-mb-px flex space-x-8"
        aria-label="Nawigacja formularza lekcji"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`${
                isActive
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

TabNavigation.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired
};

export default TabNavigation;