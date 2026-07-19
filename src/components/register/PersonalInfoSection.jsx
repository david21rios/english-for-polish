import { FaUser } from "react-icons/fa";

function PersonalInfoSection({
  name,
  lastName,
  age,
  setName,
  setLastName,
  setAge
}) {
  return (
    <>
      {/* Nombre */}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaUser className="h-5 w-5 text-gray-400" />
        </div>

        <input
          type="text"
          required
          autoComplete="given-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Imię"
          className="appearance-none relative block w-full pl-10 pr-3 py-2
            border border-gray-300 rounded-lg
            placeholder-gray-500 text-gray-900
            bg-white/50
            focus:outline-none
            focus:ring-2
            focus:ring-primary-500
            focus:border-primary-500
            sm:text-sm"
        />
      </div>

      {/* Nazwisko */}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaUser className="h-5 w-5 text-gray-400" />
        </div>

        <input
          type="text"
          required
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Nazwisko"
          className="appearance-none relative block w-full pl-10 pr-3 py-2
            border border-gray-300 rounded-lg
            placeholder-gray-500 text-gray-900
            bg-white/50
            focus:outline-none
            focus:ring-2
            focus:ring-primary-500
            focus:border-primary-500
            sm:text-sm"
        />
      </div>

      {/* Wiek */}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400">🎂</span>
        </div>

        <input
          type="number"
          min="5"
          max="120"
          required
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Wiek"
          className="appearance-none relative block w-full pl-10 pr-3 py-2
            border border-gray-300 rounded-lg
            placeholder-gray-500 text-gray-900
            bg-white/50
            focus:outline-none
            focus:ring-2
            focus:ring-primary-500
            focus:border-primary-500
            sm:text-sm"
        />
      </div>
    </>
  );
}

export default PersonalInfoSection;