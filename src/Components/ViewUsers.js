import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './ViewUsers.css';

const ViewUsers = ({ apiUrl }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch users data from the server and set it in state
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${apiUrl}/users`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const usersData = await response.json();
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
        // Handle error case as needed
      }
    };

    fetchUsers();
  }, [apiUrl]);

  return (
    <div className="container">
      <h1 className="header">View Users</h1>
      <table className="users-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>User Type</th>
            {users.some(user => user.userType === 'Student') && <th>Student Number</th>}
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.fullName || user.companyName || user.adminName}</td>
              <td>{user.email}</td>
              <td>{user.userType}</td>
              <td>
                {user.userType !== 'Admin' && (
                  <Link to={`/admin/edit-user/${user.id}`}>
                    <button>Edit</button>
                  </Link>
                )}
                </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ViewUsers;
