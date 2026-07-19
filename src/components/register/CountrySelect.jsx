// src/components/register/CountrySelect.jsx

import Select from "react-select";
import countries from "../../utils/countries";

function CountrySelect({
  selectedCountry = "",
  onChange
}) {
  const safeCountries = Array.isArray(countries)
    ? countries
    : [];

  const options = safeCountries.map(
    ({ code, name }) => ({
      value: code,
      label: name,
      code
    })
  );

  const selectedOption =
    options.find(
      (option) =>
        option.value === selectedCountry
    ) || null;

  const filterOption = (
    candidate,
    input
  ) => {
    if (!input) {
      return true;
    }

    const search = input
      .toLowerCase()
      .trim();

    const label = String(
      candidate.data.label || ""
    ).toLowerCase();

    const code = String(
      candidate.data.code || ""
    ).toLowerCase();

    return (
      label.includes(search) ||
      code.includes(search)
    );
  };

  const handleChange = (
    option
  ) => {
    if (
      typeof onChange === "function"
    ) {
      onChange(
        option?.value || ""
      );
    }
  };

  return (
    <div className="relative z-10">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span
          className="text-gray-400"
          aria-hidden="true"
        >
          🌍
        </span>
      </div>

      <div className="pl-8">
        <Select
          value={selectedOption}
          options={options}
          onChange={handleChange}
          filterOption={filterOption}
          placeholder="Wybierz kraj..."
          className="text-sm"
          classNamePrefix="react-select"
          isSearchable
          isClearable
          noOptionsMessage={() =>
            "Nie znaleziono kraju"
          }
          loadingMessage={() =>
            "Ładowanie..."
          }
          formatOptionLabel={(
            option
          ) => (
            <div className="flex items-center gap-2">
              <img
                src={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png`}
                alt=""
                className="w-5 h-4 rounded-sm object-cover"
                loading="lazy"
              />

              <span>
                {option.label}
              </span>
            </div>
          )}
        />
      </div>
    </div>
  );
}

export default CountrySelect;