import React, { useState, useEffect } from 'react';
import { FaEdit } from 'react-icons/fa';
import './Profile.css';

const Profile = ({ userId }) => {
  const [profile, setProfile] = useState({
    name: '',
    address: '',
    phone: '',
    resume: '',
    fullName: '',
    studentNumber: '',
  });

  const [isEditing, setIsEditing] = useState({
    name: false,
    address: false,
    phone: false,
    resume: false,
    fullName: false,
    studentNumber: false,
  });
  useEffect(() => {
    
    console.log('Fetching profile data for user ID:', userId); // Debugging
    fetch(`/profile/${userId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Fetched profile data:', data); // Debugging
        setProfile({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          resume: data.resume || '',
          
        });
      })
      .catch((error) => console.error('Error fetching profile data:', error));
  }, [userId]);
  
  const handleEdit = (field) => {
    setIsEditing({ ...isEditing, [field]: true });
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const handleSave = () => {
    // Send updated data to backend
    fetch(`/profile/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to save profile');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Profile updated:', data);
        setIsEditing({
          name: false,
          address: false,
          phone: false,
          resume: false,
          fullName: false,
          studentNumber: false,
        });
      })
      .catch((error) => console.error('Error updating profile:', error));
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('resume', file);

      fetch(`/upload-resume/${userId}`, {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          setProfile({ ...profile, resume: data.resumePath });
        })
        .catch((error) => console.error('Error uploading resume:', error));
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
      </div>

      <div className="profile-section">
        <h2>
          {isEditing.name ? (
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          ) : (
            <>
              {profile.name || 'No name available'}
              <FaEdit
                onClick={() => handleEdit('name')}
                className="edit-icon"
              />
            </>
          )}
        </h2>
      </div>

      <div className="profile-section">
        <h3>Full Name</h3>
        {isEditing.fullName ? (
          <input
            type="text"
            value={profile.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
          />
        ) : (
          <>
            <p>{profile.fullName || 'No full name available'}</p>
            <FaEdit
              onClick={() => handleEdit('fullName')}
              className="edit-icon"
            />
          </>
        )}
      </div>

      <div className="profile-section">
        <h3>Student Number</h3>
        {isEditing.studentNumber ? (
          <input
            type="text"
            value={profile.studentNumber}
            onChange={(e) => handleChange('studentNumber', e.target.value)}
          />
        ) : (
          <>
            <p>{profile.studentNumber || 'No student number available'}</p>
            <FaEdit
              onClick={() => handleEdit('studentNumber')}
              className="edit-icon"
            />
          </>
        )}
      </div>

      <div className="profile-section">
        <h3>Address</h3>
        {isEditing.address ? (
          <input
            type="text"
            value={profile.address}
            onChange={(e) => handleChange('address', e.target.value)}
          />
        ) : (
          <>
            <p>{profile.address || 'No address available'}</p>
            <FaEdit
              onClick={() => handleEdit('address')}
              className="edit-icon"
            />
          </>
        )}
      </div>

      <div className="profile-section">
        <h3>Phone</h3>
        {isEditing.phone ? (
          <input
            type="text"
            value={profile.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        ) : (
          <>
            <p>{profile.phone || 'No phone number available'}</p>
            <FaEdit
              onClick={() => handleEdit('phone')}
              className="edit-icon"
            />
          </>
        )}
      </div>

      <div className="profile-section">
        <h3>Resume</h3>
        {isEditing.resume ? (
          <input type="file" onChange={handleResumeUpload} />
        ) : (
          <>
            {profile.resume ? (
              <a href={`/uploads/${profile.resume}`} target="_blank" rel="noopener noreferrer">
                Download Resume
              </a>
            ) : (
              <p>No resume uploaded.</p>
            )}
            <FaEdit
              onClick={() => handleEdit('resume')}
              className="edit-icon"
            />
          </>
        )}
      </div>

      {(isEditing.name || isEditing.fullName || isEditing.studentNumber || isEditing.address || isEditing.phone || isEditing.resume) && (
        <div className="profile-section">
          <button className="save-button" onClick={handleSave}>
            Save
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
