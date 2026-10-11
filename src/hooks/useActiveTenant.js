import { useContext } from "react";
import { TenantContext } from "../context/TenantContext.jsx";

export const useActiveTenant = () => {
  const context = useContext(TenantContext);
  if (context === null) {
    throw new Error("useActiveTenant must be used within a TenantProvider.");
  }
  return context;
};

export default useActiveTenant;
