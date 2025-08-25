import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  TextField,
  Typography,
  Alert,
  Link,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const { login, register, isLoading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      clearError();
      await login({ email, password });
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      clearError();
      await register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the context
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              component="h1"
              variant="h4"
              align="center"
              color="primary"
              gutterBottom
            >
              Custom ERP
            </Typography>
            
            <Typography
              component="h2"
              variant="h6"
              align="center"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              {showRegister ? 'Create Account' : 'Sign In'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={showRegister ? handleRegister : handleLogin}
              sx={{ mt: 1 }}
            >
              {showRegister && (
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="firstName"
                    label="First Name"
                    name="firstName"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="lastName"
                    label="Last Name"
                    name="lastName"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </>
              )}
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus={!showRegister}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete={showRegister ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : showRegister ? (
                  'Create Account'
                ) : (
                  'Sign In'
                )}
              </Button>
              
              <Box sx={{ textAlign: 'center' }}>
                {showRegister ? (
                  <Typography variant="body2">
                    Already have an account?{' '}
                    <Link
                      component="button"
                      variant="body2"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowRegister(false);
                        clearError();
                      }}
                    >
                      Sign in here
                    </Link>
                  </Typography>
                ) : (
                  <Typography variant="body2">
                    Don't have an account?{' '}
                    <Link
                      component="button"
                      variant="body2"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowRegister(true);
                        clearError();
                      }}
                    >
                      Create one here
                    </Link>
                  </Typography>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;