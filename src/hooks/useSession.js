import { useContext } from "react";
import { SessionContext } from "../context/SessionContext.jsx";

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === null) {
    throw new Error("useSession must be used within a SessionProvider.");
  }
  return context;
};

export default useSession;
