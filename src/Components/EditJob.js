import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EditJob.css';

const EditJob = ({ apiUrl }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [jobDetails, setJobDetails] = useState({
    jobTitle: '',
    numPeople: '',
    jobLocation: '',
    streetAddress: '',
    jobDescription: '',
    competitionId: '',
    internalClosingDate: '',
    externalClosingDate: '',
    payLevel: '',
    employmentType: '',
    travelFrequency: '',
    jobCategory: '',
    companyName: '',
    contactInformation: ''
  });

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`${apiUrl}/jobs/${id}`);
        const result = await response.json();
        setJobDetails(result);
      } catch (error) {
        console.error('Error fetching job details:', error);
      }
    };

    fetchJobDetails();
  }, [id, apiUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJobDetails(prevDetails => ({ ...prevDetails, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (jobDetails.payLevel < 15 || jobDetails.payLevel > 50) {
      alert('Pay level must be between 15 and 50.');
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobDetails),
      });

      if (response.ok) {
        navigate('/employer/dashboard');
      } else {
        const errorMessage = await response.text();
        console.error('Error:', errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="edit-job-container">
      <h1>Edit Job</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="jobTitle">Job Title</label>
          <input
            type="text"
            id="jobTitle"
            name="jobTitle"
            value={jobDetails.jobTitle}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="numPeople">Number of People to Hire</label>
          <input
            type="number"
            id="numPeople"
            name="numPeople"
            value={jobDetails.numPeople}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="jobLocation">Job Location</label>
          <select
            id="jobLocation"
            name="jobLocation"
            value={jobDetails.jobLocation}
            onChange={handleChange}
            required
          >
            <option value="inPerson">In Person</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="streetAddress">Street Address</label>
          <input
            type="text"
            id="streetAddress"
            name="streetAddress"
            value={jobDetails.streetAddress}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="jobDescription">Job Description</label>
          <textarea
            id="jobDescription"
            name="jobDescription"
            value={jobDetails.jobDescription}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="competitionId">Competition ID</label>
          <input
            type="text"
            id="competitionId"
            name="competitionId"
            value={jobDetails.competitionId}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="internalClosingDate">Internal Closing Date</label>
          <input
            type="date"
            id="internalClosingDate"
            name="internalClosingDate"
            value={jobDetails.internalClosingDate}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="externalClosingDate">External Closing Date</label>
          <input
            type="date"
            id="externalClosingDate"
            name="externalClosingDate"
            value={jobDetails.externalClosingDate}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="payLevel">Pay Level</label>
          <input
            type="number"
            id="payLevel"
            name="payLevel"
            value={jobDetails.payLevel}
            onChange={handleChange}
            min="15"
            max="50"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="employmentType">Employment Type</label>
          <select
            id="employmentType"
            name="employmentType"
            value={jobDetails.employmentType}
            onChange={handleChange}
            required
          >
            <option value="partTime">Part Time</option>
            <option value="fullTime">Full Time</option>
            <option value="casual">Casual</option>
            <option value="onCall">On Call</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="travelFrequency">Travel Frequency</label>
          <select
            id="travelFrequency"
            name="travelFrequency"
            value={jobDetails.travelFrequency}
            onChange={handleChange}
            required
          >
            <option value="1 day per week">1 day per week</option>
            <option value="2 days per week">2 days per week</option>
            <option value="3 days per week">3 days per week</option>
            <option value="4 days per week">4 days per week</option>
            <option value="5 days per week">5 days per week</option>
            <option value="6 days per week">6 days per week</option>
            <option value="7 days per week">7 days per week</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="jobCategory">Job Category</label>
          <select
            id="jobCategory"
            name="jobCategory"
            value={jobDetails.jobCategory}
            onChange={handleChange}
            required
          >
            <option value="trades">Trades</option>
            <option value="information technology">Information Technology</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="finance">Finance</option>
            <option value="engineering">Engineering</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
            <option value="administration">Administration</option>
            <option value="human resources">Human Resources</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="companyName">Company Name</label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={jobDetails.companyName}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="contactInformation">Contact Information</label>
          <textarea
            id="contactInformation"
            name="contactInformation"
            value={jobDetails.contactInformation}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default EditJob;
