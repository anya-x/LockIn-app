import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from "@mui/material";

interface NavigationGuardContextType {
  // Register a guard that returns true if navigation should be blocked
  registerGuard: (id: string, check: () => boolean, onSave?: () => Promise<void>) => void;
  unregisterGuard: (id: string) => void;
  // Call this before navigating - returns true if navigation is allowed
  requestNavigation: (targetPath: string, onNavigate: () => void) => void;
  // Extra info for the dialog
  setGuardMessage: (message: string, replaceWarning?: string) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | undefined>(undefined);

export const useNavigationGuard = () => {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error("useNavigationGuard must be used within NavigationGuardProvider");
  }
  return context;
};

interface Guard {
  check: () => boolean;
  onSave?: () => Promise<void>;
}

export const NavigationGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const guardsRef = useRef<Map<string, Guard>>(new Map());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [guardMessage, setGuardMessageState] = useState("You have unsaved changes. If you leave now, your changes will be lost.");
  const [replaceWarning, setReplaceWarning] = useState<string | undefined>();
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const activeGuardRef = useRef<Guard | null>(null);

  const registerGuard = useCallback((id: string, check: () => boolean, onSave?: () => Promise<void>) => {
    guardsRef.current.set(id, { check, onSave });
  }, []);

  const unregisterGuard = useCallback((id: string) => {
    guardsRef.current.delete(id);
  }, []);

  const setGuardMessage = useCallback((message: string, replace?: string) => {
    setGuardMessageState(message);
    setReplaceWarning(replace);
  }, []);

  const requestNavigation = useCallback((targetPath: string, onNavigate: () => void) => {
    // Check all guards
    for (const [, guard] of guardsRef.current) {
      if (guard.check()) {
        // Navigation should be blocked
        pendingNavigationRef.current = onNavigate;
        activeGuardRef.current = guard;
        setDialogOpen(true);
        return;
      }
    }
    // No guards blocking, navigate immediately
    onNavigate();
  }, []);

  const handleStay = () => {
    setDialogOpen(false);
    pendingNavigationRef.current = null;
    activeGuardRef.current = null;
  };

  const handleLeaveWithoutSaving = () => {
    setDialogOpen(false);
    if (pendingNavigationRef.current) {
      pendingNavigationRef.current();
      pendingNavigationRef.current = null;
    }
    activeGuardRef.current = null;
  };

  const handleSaveAndLeave = async () => {
    if (activeGuardRef.current?.onSave) {
      setSaving(true);
      try {
        await activeGuardRef.current.onSave();
        setDialogOpen(false);
        if (pendingNavigationRef.current) {
          pendingNavigationRef.current();
          pendingNavigationRef.current = null;
        }
      } catch (error) {
        console.error("Failed to save before leaving:", error);
      } finally {
        setSaving(false);
      }
    }
    activeGuardRef.current = null;
  };

  const value: NavigationGuardContextType = {
    registerGuard,
    unregisterGuard,
    requestNavigation,
    setGuardMessage,
  };

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}

      {/* Navigation Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={handleStay}>
        <DialogTitle>Unsaved Notes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {guardMessage}
            {replaceWarning && (
              <Box component="span" sx={{ display: "block", mt: 1, fontStyle: "italic" }}>
                {replaceWarning}
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleStay} color="primary">
            Stay
          </Button>
          {activeGuardRef.current?.onSave && (
            <Button onClick={handleSaveAndLeave} color="success" disabled={saving}>
              {saving ? "Saving..." : "Save & Leave"}
            </Button>
          )}
          <Button onClick={handleLeaveWithoutSaving} color="error">
            Leave Without Saving
          </Button>
        </DialogActions>
      </Dialog>
    </NavigationGuardContext.Provider>
  );
};
