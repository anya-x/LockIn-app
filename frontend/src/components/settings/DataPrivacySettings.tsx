import React, { useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  useTheme,
} from "@mui/material";
import {
  Download as DownloadIcon,
  DeleteForever as DeleteIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import userPreferencesService from "../../services/userPreferencesService";
import { useAuth } from "../../context/AuthContext";

const DataPrivacySettings: React.FC = () => {
  const theme = useTheme();
  const { logout } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleExportData = async () => {
    try {
      setExporting(true);
      setExportError(null);
      setExportSuccess(false);

      const data = await userPreferencesService.exportUserData();

      // Create a download link for the JSON data
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lockin-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
    } catch (error) {
      console.error("Failed to export data:", error);
      setExportError("Failed to export your data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);

      await userPreferencesService.deleteAccount();

      // Log out the user after successful deletion
      logout();
    } catch (error) {
      console.error("Failed to delete account:", error);
      setDeleteError("Failed to delete your account. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <SecurityIcon
            sx={{ color: theme.palette.primary.main, fontSize: 28 }}
          />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Data & Privacy
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Export your data or delete your account
            </Typography>
          </Box>
        </Box>

        {exportError && (
          <Alert severity="error" onClose={() => setExportError(null)} sx={{ mb: 2 }}>
            {exportError}
          </Alert>
        )}

        {exportSuccess && (
          <Alert severity="success" onClose={() => setExportSuccess(false)} sx={{ mb: 2 }}>
            Your data has been exported successfully!
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <DownloadIcon fontSize="small" sx={{ color: "text.secondary" }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Export Your Data
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Download all your data including tasks, goals, and analytics
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              onClick={handleExportData}
              disabled={exporting}
              startIcon={exporting ? <CircularProgress size={16} /> : <DownloadIcon />}
            >
              {exporting ? "Exporting..." : "Export"}
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <DeleteIcon fontSize="small" sx={{ color: "error.main" }} />
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500, color: "error.main" }}>
                  Delete Account
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Permanently delete your account and all data
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialogOpen(true)}
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </Box>
        </Box>
      </CardContent>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteConfirmText("");
          setDeleteError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: "error.main" }}>
          Delete Your Account
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action is <strong>permanent and irreversible</strong>. All your data will be deleted:
          </Alert>

          <Typography variant="body2" sx={{ mb: 2 }}>
            - All tasks and task history
            <br />
            - All goals and progress
            <br />
            - All focus sessions and notes
            <br />
            - All badges and achievements
            <br />
            - All analytics and statistics
            <br />
            - Your account profile
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            We recommend <strong>exporting your data</strong> before deleting your account.
          </Typography>

          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 1 }}>
            Type <strong>DELETE</strong> to confirm:
          </Typography>

          <TextField
            fullWidth
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE"
            disabled={deleting}
            autoComplete="off"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setDeleteConfirmText("");
              setDeleteError(null);
            }}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== "DELETE" || deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? "Deleting..." : "Delete My Account"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default DataPrivacySettings;
