import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = ({ apiUrl }) => {
  const { userId } = useParams();
  const [isEditing, setIsEditing] = useState({});
  const [newSkill, setNewSkill] = useState('');
  const [profile, setProfile] = useState({
    fullName: '',
    personalStatement: '',
    skills: [],
    education: '',
    experience: '',
    courses: [], // Courses taken, fetched from backend
    resume: '',
    email: '', // Contact information
    jobsApplied: [] // Jobs applied, fetched from backend
  });

  useEffect(() => {
    // Fetch profile data, courses taken, and jobs applied when the component mounts
    fetch(`${apiUrl}/profile/${userId}`)
      .then(response => response.json())
      .then(data => {
        setProfile({
          ...data,
          skills: data.skills ? data.skills.split(',').map(skill => skill.trim()) : [],
          courses: data.courses || [],
          jobsApplied: data.jobsApplied || [],
        });
      })
      .catch(error => console.error('Error fetching profile data:', error));
  }, [userId, apiUrl]);

  const toggleEdit = (field) => {
    setIsEditing(prevState => ({ ...prevState, [field]: !prevState[field] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleSkillChange = (e) => {
    setNewSkill(e.target.value);
  };

  const addSkill = () => {
    if (newSkill) {
      setProfile(prevProfile => ({
        ...prevProfile,
        skills: [...prevProfile.skills, newSkill]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setProfile(prevProfile => ({
      ...prevProfile,
      skills: prevProfile.skills.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    setIsEditing({});
    const updatedProfile = {
        ...profile,
        skills: profile.skills.join(', '),
    };
    
    console.log('Data to be sent:', updatedProfile); // Log the data being sent

    fetch(`${apiUrl}/profile/${userId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Profile updated:', data);
        // Show a success message or any UI feedback
    })
    .catch(error => console.error('Error updating profile:', error));
};


  return (
    <div className="profile-container">
      <div className="profile-header">
        <img src="/path/to/profile-picture.jpg" alt="Profile" />
        <div className="profile-info">
          <h1>{profile.fullName}</h1>
          
        </div>
        <div className="profile-actions">
          <button>Share Profile</button>
          <button>Unpublish Profile</button>
        </div>
      </div>

      <div className="profile-section">
        <h2>Personal Statement <span className="edit-icon" onClick={() => toggleEdit('personalStatement')}>&#9998;</span></h2>
        {isEditing.personalStatement ? (
          <textarea
            name="personalStatement"
            value={profile.personalStatement}
            onChange={handleInputChange}
          />
        ) : (
          <p>{profile.personalStatement}</p>
        )}
      </div>

      <div className="profile-section">
        <h2>Skills <span className="edit-icon" onClick={() => toggleEdit('skills')}>&#9998;</span></h2>
        {isEditing.skills ? (
          <div>
            <input
              type="text"
              value={newSkill}
              onChange={handleSkillChange}
              placeholder="Add a skill"
            />
            <button onClick={addSkill}>Add</button>
            <div className="skills">
              {profile.skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                  <span className="remove-skill" onClick={() => removeSkill(index)}>&times;</span>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="skills">
            {profile.skills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))}
          </div>
        )}
      </div>

      <div className="profile-section">
        <h2>Education <span className="edit-icon" onClick={() => toggleEdit('education')}>&#9998;</span></h2>
        {isEditing.education ? (
          <input
            type="text"
            name="education"
            value={profile.education}
            onChange={handleInputChange}
          />
        ) : (
          <div className="education-entry">
            <h3>{profile.education}</h3>
           
          </div>
        )}
      </div>

      <div className="profile-section">
        <h2>Experience <span className="edit-icon" onClick={() => toggleEdit('experience')}>&#9998;</span></h2>
        {isEditing.experience ? (
          <textarea
            name="experience"
            value={profile.experience}
            onChange={handleInputChange}
          />
        ) : (
          <p>{profile.experience}</p>
        )}
      </div>

      <div className="profile-section">
        <h2>Courses Taken</h2>
        <ul>
          {profile.courses.length > 0 ? (
            profile.courses.map((course, index) => (
              <li key={index}>{course.courseName}</li>
            ))
          ) : (
            <p>No courses taken yet.</p>
          )}
        </ul>
      </div>

      <div className="profile-section">
        <h2>Resume <span className="edit-icon" onClick={() => toggleEdit('resume')}>&#9998;</span></h2>
        {isEditing.resume ? (
          <input
            type="file"
            name="resume"
            onChange={(e) => setProfile({ ...profile, resume: e.target.files[0].name })}
          />
        ) : (
          <p>{profile.resume || 'No Resume Uploaded'}</p>
        )}
      </div>

      <div className="profile-section">
        <h2>Contact Information</h2>
        <p>Email: {profile.email}</p>
      </div>

      <div className="profile-section">
        <h2>Jobs Applied</h2>
        <ul>
          {profile.jobsApplied.length > 0 ? (
            profile.jobsApplied.map((job, index) => (
              <li key={index}>{job.jobTitle} at {job.companyName}</li>
            ))
          ) : (
            <p>No jobs applied yet.</p>
          )}
        </ul>
      </div>

      <div className="save-button-container">
        <button onClick={handleSave}>Save Changes</button>
      </div>
    </div>
  );
};

export default ProfilePage;
