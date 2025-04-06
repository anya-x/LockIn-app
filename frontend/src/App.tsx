import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <div style={{ padding: "2rem" }}>
          <h1>LockIn Task Manager</h1>
          <p>AHhhhh </p>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
