import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface AIPreferencesContextType {
  aiEnabled: boolean;
  toggleAI: () => void;
}

const AIPreferencesContext = createContext<
  AIPreferencesContextType | undefined
>(undefined);

const AI_ENABLED_KEY = "lockin-ai-enabled";

export const AIPreferencesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(AI_ENABLED_KEY);
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem(AI_ENABLED_KEY, JSON.stringify(aiEnabled));
  }, [aiEnabled]);

  const toggleAI = () => {
    setAiEnabled((prev) => !prev);
  };

  return (
    <AIPreferencesContext.Provider value={{ aiEnabled, toggleAI }}>
      {children}
    </AIPreferencesContext.Provider>
  );
};

export const useAIPreferences = (): AIPreferencesContextType => {
  const context = useContext(AIPreferencesContext);
  if (!context) {
    throw new Error(
      "useAIPreferences must be used within AIPreferencesProvider"
    );
  }
  return context;
};
