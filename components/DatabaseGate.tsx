import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';

interface DatabaseGateProps {
  children: React.ReactNode;
  loadingText?: string;
}

export const DatabaseGate = ({ children, loadingText }: DatabaseGateProps) => {
  const { isDbReady, dbError } = useAppContext();

  if (dbError) {
    return <ErrorState title="Database Error" message={dbError} />;
  }

  if (!isDbReady) {
    return <LoadingState text={loadingText} />;
  }

  return <>{children}</>;
};
