import { useState } from 'react';
import Modal from '../components/Modal';

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  resolve?: (value: boolean) => void;
}

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
  });

  const showAlert = (message: string, title: string = 'Informacja') => {
    setModalState({
      isOpen: true,
      title,
      message,
      type: 'alert',
    });
  };

  const showConfirm = (message: string, title: string = 'Potwierdzenie'): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type: 'confirm',
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    if (modalState.resolve) {
      modalState.resolve(true);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleClose = () => {
    if (modalState.type === 'confirm' && modalState.resolve) {
      modalState.resolve(false);
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const ModalComponent = () => (
    <Modal
      isOpen={modalState.isOpen}
      onClose={handleClose}
      title={modalState.title}
      message={modalState.message}
      type={modalState.type}
      onConfirm={handleConfirm}
    />
  );

  return {
    showAlert,
    showConfirm,
    ModalComponent,
  };
}
