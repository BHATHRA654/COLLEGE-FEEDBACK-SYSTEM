import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NavigationProvider } from './context/NavigationContext';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NavigationProvider>
          <AppRoutes />
        </NavigationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
