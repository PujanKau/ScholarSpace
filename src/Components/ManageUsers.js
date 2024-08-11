import React from 'react';
import { Link } from 'react-router-dom';
import './ManageUsers.css';

const ManageUsers = () => {
  return (
    <div className="container">
      <h1 className="header">Manage Users</h1>
      <div className="user-options">
        <Link to="/admin/view-users" className="user-button">View Users</Link>
        <Link to="/admin/add-user" className="user-button">Add User</Link>
        <Link to="/admin/edit-user/:userId" className="user-button">Edit User</Link>
      </div>
    </div>
  );
};

export default ManageUsers;