import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import { getInitials } from '../utils/getInitials'; // Import the utility function
import './Navbar.css';

const NavbarStudent = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser({ userId: null, userType: null, fullName: '', initials: '' });
    navigate('/'); // Redirect to the landing page
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src="/path/to/logo.png" alt="Career Connection Logo" />
      </div>
      <div className="navbar-links">
        <Link to="/student/dashboard">Dashboard</Link>
        <Link to="/jobs">Jobs</Link>
        <Link to="/employers">Employers</Link>
        <Link to="/courses">Courses</Link>
      </div>
      <div className="navbar-profile">
        {user.userId ? (
          <>
            <Link to={`/profile/${user.userId}`} className="profile-initials">
              {getInitials(user.fullName)}

            </Link>
            <button className="logout-button" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link to="/">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default NavbarStudent;
