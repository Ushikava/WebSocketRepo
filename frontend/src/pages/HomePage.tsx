import { Box, Container, Typography, Paper, styled, Divider, Link, Button } from "@mui/material";
import { Email, Phone, LocationOn, GitHub, Casino  } from "@mui/icons-material";
import { keyframes } from "@mui/system";
import { CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const GradientBox = styled(Box)(({ theme }) => ({
  background: "linear-gradient(-45deg, #b5ead7, #ffdac1, #e2f0cb, #ffb7b2)",
  backgroundSize: "400% 400%",
  animation: `${gradientAnimation} 20s ease infinite`,
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  textAlign: "center",
  fontFamily: "Arial"
}));

const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { margin: 0, padding: 0 },
        html: { margin: 0, padding: 0 },
      },
    },
  },
});

function HomePage() {
  const navigate = useNavigate();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GradientBox sx={{ minHeight: "100vh" }}>
        <Container maxWidth="sm">
          <Box sx={{ my: 8, color: "white" }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)", color: "white" }}
            >
              Ushikava Mori
            </Typography>

            <Typography
              variant="h6" 
              component="h2" 
              gutterBottom
              sx={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)", color: "white" }}
            >
              Pet projects
            </Typography>

            <Paper elevation={3} sx={{ padding: 4, marginTop: 4 }}
              style={{ backgroundColor: "rgba(255, 255, 255, 0.85)" }}
            >
              <Typography variant="body1" paragraph>
                Welcome to the rice fields, motherf*cker
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Button
                variant="contained"
                startIcon={<Casino   />}
                onClick={() => navigate('/login')}
                sx={{ bgcolor: '#7c4dff', '&:hover': { bgcolor: '#651fff' } }}
              >
                Board games canvas (test)
              </Button>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 3 }}>
                <Link href="mailto:doni9791@gmail.com" color="inherit">
                  <Email fontSize="large" />
                </Link>
                <Link href="tel:+79149419190" color="inherit">
                  <Phone fontSize="large" />
                </Link>
                <Link href="https://github.com/ushikava" target="_blank" color="inherit">
                  <GitHub fontSize="large" />
                </Link>
              </Box>

              <Typography variant="body2" sx={{ mb: 3 }}>
                <LocationOn fontSize="small" /> Saint-Petersburg, Russian Federation
              </Typography>


              
            </Paper>
          </Box>
        </Container>
      </GradientBox>
    </ThemeProvider>
  );
}

export default HomePage;
