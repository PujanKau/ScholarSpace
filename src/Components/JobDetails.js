import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavbarStudent from './NavbarStudent'; // Assuming you have a Navbar component
import './JobDetails.css';

const JobDetails = ({ apiUrl }) => {
  const { jobId } = useParams();
  const [jobDetails, setJobDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`${apiUrl}/jobs/${jobId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch job details');
        }
        const result = await response.json();
        setJobDetails(result);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching job details:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId, apiUrl]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!jobDetails) {
    return <div>No job details found.</div>;
  }

  const handleSave = () => {
    alert('Job saved!');
  };

  const handleApply = () => {
    navigate(`/apply-job/${jobId}`);
  };

  return (
    <div className="job-details-page">
      <NavbarStudent /> {/* Include the navbar at the top */}
      <div className="job-details-container">
        <div className="job-header">
          <div className="job-header-left">
            <img src="/logo.png" alt="Company Logo" className="company-logo" />
            <div>
              <h1>{jobDetails.jobTitle}</h1>
              <p>{jobDetails.companyName} - {jobDetails.jobLocation}</p>
              <p>{jobDetails.jobType}</p>
            </div>
          </div>
          <div className="job-header-right">
            <button className="save-button" onClick={handleSave}>Save</button>
            <button className="apply-button" onClick={handleApply}>Apply</button>
          </div>
        </div>
        <div className="job-description">
          <h2>Job Description</h2>
          <table className="job-details-table">
            <tbody>
              <tr>
                <td><strong>Competition ID:</strong></td>
                <td>{jobDetails.competitionId}</td>
              </tr>
              <tr>
                <td><strong>Internal Closing Date:</strong></td>
                <td>{jobDetails.internalClosingDate}</td>
              </tr>
              <tr>
                <td><strong>External Closing Date:</strong></td>
                <td>{jobDetails.externalClosingDate}</td>
              </tr>
              <tr>
                <td><strong># of Openings:</strong></td>
                <td>{jobDetails.numPeople}</td>
              </tr>
              <tr>
                <td><strong>Pay Level:</strong></td>
                <td>{jobDetails.payLevel}</td>
              </tr>
              <tr>
                <td><strong>Employment Type:</strong></td>
                <td>{jobDetails.employmentType}</td>
              </tr>
              <tr>
                <td><strong>Workplace Type:</strong></td>
                <td>{jobDetails.jobLocation}</td>
              </tr>
              <tr>
                <td><strong>Travel Frequency:</strong></td>
                <td>{jobDetails.travelFrequency}</td>
              </tr>
              <tr>
                <td><strong>Employee Group:</strong></td>
                <td>{jobDetails.employeeGroup}</td>
              </tr>
              <tr>
                <td><strong>Job Description:</strong></td>
                <td>{jobDetails.jobDescription}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="contact-information">
          <h2>Contact Information</h2>
          <p>{jobDetails.contactInformation}</p>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
