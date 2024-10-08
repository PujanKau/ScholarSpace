import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page"> {/* Apply specific class here */}
      <header className="header">
        <img src="/logo.png" alt="ScholarSpace Logo" className="logo" />
      </header>
      <main className="main-content">
        <h1>What type of user are you?</h1>
        <div className="user-types">
          <div className="user-type">
            <Link to="/student">
              <div className="icon student-icon"></div>
              <span>Student/Alumni</span>
            </Link>
          </div>
          <div className="user-type">
            <Link to="/employer">
              <div className="icon employer-icon"></div>
              <span>Employer</span>
            </Link>
          </div>
          <div className="user-type">
            <Link to="/admin">
              <div className="icon admin-icon"></div>
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </main>
      <footer className="footer">
        <p>Powered by ScholarSpace</p>
        <p>
          <a href="/privacy">Privacy Policy</a> | <a href="/terms">Terms of Use</a>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
