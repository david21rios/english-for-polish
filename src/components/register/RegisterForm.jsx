import RegisterHeader from "./RegisterHeader";
import PersonalInfoSection from "./PersonalInfoSection";
import AccountSection from "./AccountSection";
import CountrySelect from "./CountrySelect";
import PasswordFields from "./PasswordFields";
import RegisterButton from "./RegisterButton";

function RegisterForm({
  handleSubmit,
  error,
  loading,

  personalInfo,
  account,
  country,
  password
}) {
  return (
    <>
      <RegisterHeader />

      <form
        className="mt-8 space-y-6"
        onSubmit={handleSubmit}
      >
        <div className="rounded-md space-y-4">

          <PersonalInfoSection
            {...personalInfo}
          />

          <AccountSection
            {...account}
          />

          <CountrySelect
            selectedCountry={country.selectedCountry}
            onChange={country.onChange}
          />

          <PasswordFields
            {...password}
          />

        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        <RegisterButton
          loading={loading}
        />

      </form>
    </>
  );
}

export default RegisterForm;