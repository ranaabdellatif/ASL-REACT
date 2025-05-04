

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import AuthenticatedRoute from './AuthenticatedRoute';
import ASLWebRecorder from './ASLWebRecorder.js';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route
            path="/record"
            element={
              <AuthenticatedRoute>
                <ASLWebRecorder />
              </AuthenticatedRoute>
            }
          />
          {/* Optional: Redirect root to login or recording */}
          <Route path="*" element={<LoginForm />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;




/*
import React from 'react';
import ASLWebRecorder from './ASLWebRecorder.js';

function App() {
  return <ASLWebRecorder />;
}

export default App;
*/