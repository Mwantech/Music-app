import React, { createContext, useContext, useState } from 'react';

// Create the context
const MusicContext = createContext(null);

// Provider component
export function MusicProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null);
  
  return (
    <MusicContext.Provider value={{ currentSong, setCurrentSong }}>
      {children}
    </MusicContext.Provider>
  );
}

// Custom hook for accessing the music context
export function useMusic() {
  const context = useContext(MusicContext);
  if (context === null) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}