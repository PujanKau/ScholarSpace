import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NavbarStudent from './NavbarStudent';
import './JobListings.css';


const JobListings = ({ apiUrl }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [positionType, setPositionType] = useState('');
  const [jobCategory, setJobCategory] = useState('');
  const [workType, setWorkType] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${apiUrl}/jobs`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const jobsData = await response.json();
        setJobs(jobsData);
        setFilteredJobs(jobsData); // Initially, display all jobs
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchJobs();
  }, [apiUrl]);

  const handleSearch = () => {
    const filtered = jobs.filter(job => {
      return (
        (!searchKeyword || job.jobTitle.toLowerCase().includes(searchKeyword.toLowerCase())) &&
        (!location || job.streetAddress.toLowerCase().includes(location.toLowerCase())) &&
        (!positionType || job.employmentType === positionType) &&
        (!jobCategory || job.jobCategory === jobCategory) &&
        (!workType || job.jobLocation === workType)
      );
    });
    setFilteredJobs(filtered);
  };

  if (loading) {
    return <p>Loading jobs...</p>;
  }

  if (error) {
    return <p>Error fetching jobs: {error}</p>;
  }

  return (
    <div className="job-listings-container">
      <NavbarStudent />
      <NavbarStudent />
      <main className="dashboard-main">
        <h2>Job Listings</h2>
        <div className="job-filters">
          <input
            type="text"
            placeholder="Keywords"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <select
            value={positionType}
            onChange={(e) => setPositionType(e.target.value)}
          >
            <option value="">Position Type</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Co-op">Co-op</option>
            <option value="Casual">Casual</option>
            <option value="On Call">On Call</option>
          </select>
          <select
            value={jobCategory}
            onChange={(e) => setJobCategory(e.target.value)}
          >
            <option value="">Job Categories</option>
            <option value="trades">Trades</option>
            <option value="informationTechnology">Information Technology</option>
            <option value="healthCare">Health Care</option>
            <option value="education">Education</option>
            <option value="finance">Finance</option>
            <option value="engineering">Engineering</option>
            <option value="hospitality">Hospitality</option>
            <option value="retail">Retail</option>
            {/* Add more job categories as needed */}
          </select>
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
          >
            <option value="">Remote/On-Site</option>
            <option value="remote">Remote</option>
            <option value="inPerson">In person – precise location</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <button className="search-button" onClick={handleSearch}>Search</button>
        </div>
        <div className="job-cards">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job, index) => (
              <Link to={`/job-details/${job.id}`} key={index} className="job-card-link">
                <div className="job-card">
                  <h3>{job.jobTitle}</h3>
                  <p>{job.companyName}</p>
                  <p>{job.streetAddress}</p>
                  <p>{job.employmentType}</p>
                  <p>{job.status || 'Not Applied'}</p>
                </div>
              </Link>
            ))
          ) : (
            <p>No jobs found matching your criteria.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default JobListings;
