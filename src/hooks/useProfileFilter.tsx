import { createContext, useContext, useState, ReactNode } from 'react';

interface ProfileFilterContextType {
  profileFilter: string | null;
  setProfileFilter: (id: string | null) => void;
}

const ProfileFilterContext = createContext<ProfileFilterContextType | undefined>(undefined);

export function ProfileFilterProvider({ children }: { children: ReactNode }) {
  const [profileFilter, setProfileFilter] = useState<string | null>(null);

  return (
    <ProfileFilterContext.Provider value={{ profileFilter, setProfileFilter }}>
      {children}
    </ProfileFilterContext.Provider>
  );
}

export function useProfileFilter() {
  const context = useContext(ProfileFilterContext);
  if (!context) {
    throw new Error('useProfileFilter must be used within ProfileFilterProvider');
  }
  return context;
}
