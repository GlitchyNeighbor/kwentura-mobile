import React, { createContext, useState, useContext } from 'react';

const AuthFlowContext = createContext();

export const useAuthFlow = () => useContext(AuthFlowContext);

export const AuthFlowProvider = ({ children }) => {
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [registrationCompleted, setRegistrationCompleted] = useState(0);

  return (
    <AuthFlowContext.Provider value={{ isVerifyingEmail, setIsVerifyingEmail, registrationCompleted, setRegistrationCompleted }}>
      {children}
    </AuthFlowContext.Provider>
  );
};