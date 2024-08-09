import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import CustomErrorMessage from './CustomErrorMessage'; // Import the custom error message component
import './StudentAuthPage.css';

const StudentAuthPage = ({ apiUrl }) => {
  const { setUser } = useContext(UserContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    const url = isLogin ? `${apiUrl}/login` : `${apiUrl}/signup`;
    const data = isLogin
      ? { email, password, userType: 'student' }
      : { email, password, fullName, studentNumber, userType: 'student' };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setUser({
          userId: result.userId,
          userType: 'student',
          name: result.name,
        });
        navigate('/student/dashboard');
      } else {
        const errorMessage = await response.text();
        setError(errorMessage);
        setShowError(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred. Please try again.');
      setShowError(true);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  const closeError = () => {
    setShowError(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>{isLogin ? 'Student Login' : 'Student Sign Up'}</h1>
        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{isLogin ? 'Password:' : 'Create Password:'}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="fullName">Full Name:</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="studentNumber">Student Number:</label>
                <input
                  type="text"
                  id="studentNumber"
                  name="studentNumber"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          <button type="submit">{isLogin ? 'Login' : 'Sign Up'}</button>
        </form>
        <button className="toggle-button" onClick={toggleAuthMode}>
          {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
        </button>
      </div>
    
      {showError && <CustomErrorMessage message={error} onClose={closeError} />}
    </div>
  );
}

export default StudentAuthPage;
