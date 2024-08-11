import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EditUser.css';

const EditUser = ({ apiUrl }) => {
  const { userId } = useParams();
  const [user, setUser] = useState({
    fullName: '',
    email: '',
    userType: '',
    studentNumber: ''
  });
  const [submissionSuccess, setSubmissionSuccess] = useState(false); // State for showing success card
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${apiUrl}/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [apiUrl, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser(prevUser => ({
      ...prevUser,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const updatedUser = { ...user, requestorUserType: 'Admin' }; // Assuming the logged-in user is an admin
        const response = await fetch(`${apiUrl}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedUser),
        });

        if (response.ok) {
            setSubmissionSuccess(true);
            setTimeout(() => {
                navigate('/view-users');
            }, 2000);
        } else {
            console.error('Error updating user');
        }
    } catch (error) {
        console.error('Error updating user:', error);
    }
};


  return (
    <div className="container">
      {submissionSuccess ? (
        <div className="success-card">
          <h2>Success!</h2>
          <p>User has been updated successfully.</p>
        </div>
      ) : (
        <>
          <h1 className="header">Edit User</h1>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name:</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={user.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="userType">User Type:</label>
              <select
                id="userType"
                name="userType"
                value={user.userType}
                onChange={handleChange}
              >
                <option value="Student">Student</option>
                <option value="Employer">Employer</option>
              </select>
            </div>
            {user.userType === 'Student' && (
              <div className="form-group">
                <label htmlFor="studentNumber">Student Number:</label>
                <input
                  type="text"
                  id="studentNumber"
                  name="studentNumber"
                  value={user.studentNumber || ''}
                  onChange={handleChange}
                />
              </div>
            )}
            <button type="submit">Update User</button>
          </form>
        </>
      )}
    </div>
  );
};

export default EditUser;
