import React, { createContext, useContext, useState } from 'react';
import Login from '../components/Login';

const ModalContext = createContext(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  const value = {
    loginModalOpen,
    openLoginModal,
    closeLoginModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Login isOpen={loginModalOpen} onClose={closeLoginModal} />
    </ModalContext.Provider>
  );
};

export default ModalContext;