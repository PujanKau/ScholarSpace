require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const { v1: uuidv1 } = require('uuid');
const { uploadFileToAzure } = require('./azureStorage');
const app = express();
const port = process.env.SERVER_PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
    host: process.env.DB_SERVER,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the Azure MySQL Database:' + err.stack);
        return;
    }
    console.log('Connected to Azure MySQL Database successfully.');
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/login', (req, res) => {
    const { email, password, userType } = req.body;
    const query = 'SELECT users.id, userType, fullName, companyName, adminName FROM users LEFT JOIN students ON users.id = students.user_id LEFT JOIN employers ON users.id = employers.user_id LEFT JOIN admins ON users.id = admins.user_id WHERE email = ? AND password = ? AND userType = ?';

    db.execute(query, [email, password, userType], (err, results) => {
        if (err) {
            console.error('Error fetching data: ' + err.stack);
            res.status(500).send('Error logging in.');
            return;
        }
        if (results.length > 0) {
            const { id, userType, fullName, companyName, adminName } = results[0];
            const name = fullName || companyName || adminName;
            res.json({ userId: id, userType, name });
        } else {
            res.status(401).send('Invalid credentials or user type.');
        }
    });
});

app.post('/signup', (req, res) => {
    const { email, password, userType, fullName, studentNumber, companyName, companyAddress } = req.body;
  
    // First, check if the email already exists in the database
    const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
  
    db.execute(checkEmailQuery, [email], (err, results) => {
      if (err) {
        console.error('Error checking email:', err.stack);
        return res.status(500).json({ message: 'Error checking email.' });
      }
  
      if (results.length > 0) {
        // Email already exists
        return res.status(400).json({ message: 'This email is already registered. Please sign in.' });
      }
  
      // If the email does not exist, proceed with sign-up
      const insertUserQuery = 'INSERT INTO users (email, password, userType) VALUES (?, ?, ?)';
  
      db.execute(insertUserQuery, [email, password, userType], (err, results) => {
        if (err) {
          console.error('Error inserting user data:', err.stack);
          return res.status(500).json({ message: 'Error signing up.' });
        }
  
        const userId = results.insertId;
  
        if (userType === 'student') {
          const insertStudentQuery = 'INSERT INTO students (user_id, fullName, studentNumber) VALUES (?, ?, ?)';
          db.execute(insertStudentQuery, [userId, fullName, studentNumber], (err) => {
            if (err) {
              console.error('Error inserting student data:', err.stack);
              return res.status(500).json({ message: 'Error signing up.' });
            }
            res.json({ userId, userType, fullName });
          });
        } else if (userType === 'employer') {
          const insertEmployerQuery = 'INSERT INTO employers (user_id, companyName, companyAddress) VALUES (?, ?, ?)';
          db.execute(insertEmployerQuery, [userId, companyName, companyAddress], (err) => {
            if (err) {
              console.error('Error inserting employer data:', err.stack);
              return res.status(500).json({ message: 'Error signing up.' });
            }
            res.json({ userId, userType, companyName });
          });
        } else {
          res.status(400).json({ message: 'Invalid user type.' });
        }
      });
    });
  });

app.get('/profile/:userId', (req, res) => {
    const { userId } = req.params;
  
    const userQuery = 'SELECT id, name, userType, address, phone, resume FROM users WHERE id = ?';
  
    db.execute(userQuery, [userId], (err, userResults) => {
      if (err) {
        console.error('Error fetching user data:', err.stack);
        return res.status(500).json({ message: 'Error fetching user data.' });
      }
  
      if (userResults.length > 0) {
        const userProfile = userResults[0];
        console.log('User profile fetched:', userProfile); // Debugging
  
        if (userProfile.userType === 'student') {
          const studentQuery = 'SELECT fullName, studentNumber FROM students WHERE user_id = ?';
          db.execute(studentQuery, [userId], (err, studentResults) => {
            if (err) {
              console.error('Error fetching student data:', err.stack);
              return res.status(500).json({ message: 'Error fetching student data.' });
            }
  
            if (studentResults.length > 0) {
              userProfile.fullName = studentResults[0].fullName;
              userProfile.studentNumber = studentResults[0].studentNumber;
            }
  
            res.json(userProfile); // Return combined data
          });
        } else {
          res.json(userProfile); // Return user data if not a student
        }
      } else {
        res.status(404).json({ message: 'User not found.' });
      }
    });
  });
  
  
  
  
  app.put('/profile/:userId', (req, res) => {
    const { userId } = req.params;
    const { name, address, phone, resume, fullName, studentNumber } = req.body;
  
    const updateUserQuery = `
      UPDATE users SET name = ?, address = ?, phone = ?, resume = ? WHERE id = ?
    `;
    const userParams = [name, address, phone, resume, userId];
  
    db.execute(updateUserQuery, userParams, (err) => {
      if (err) {
        console.error('Error updating user data:', err.stack);
        return res.status(500).json({ message: 'Error updating user data.' });
      }
  
      const updateStudentQuery = `
        UPDATE students SET fullName = ?, studentNumber = ? WHERE user_id = ?
      `;
      const studentParams = [fullName, studentNumber, userId];
  
      db.execute(updateStudentQuery, studentParams, (err) => {
        if (err) {
          console.error('Error updating student data:', err.stack);
          return res.status(500).json({ message: 'Error updating student data.' });
        }
  
        res.json({ message: 'Profile updated successfully!' });
      });
    });
  });
  

app.post('/upload-resume/:userId', upload.single('resume'), async (req, res) => {
    try {
      const { userId } = req.params;
      const resume = req.file;
  
      if (!resume) {
        return res.status(400).json({ message: 'No resume uploaded.' });
      }
  
      const resumePath = await uploadFileToAzure(resume.buffer, resume.originalname);
  
      // Update the user's resume path in the database
      const query = 'UPDATE users SET resumePath = ? WHERE id = ?';
      db.execute(query, [resumePath, userId], (err) => {
        if (err) {
          console.error('Error updating resume path:', err.stack);
          return res.status(500).json({ message: 'Error saving resume path.' });
        }
        res.json({ message: 'Resume uploaded successfully!', resumePath });
      });
    } catch (error) {
      console.error('Error uploading resume:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  });
  

// Route to post a new job
app.post('/post-job', (req, res) => {
    const { jobTitle, numPeople, jobLocation, streetAddress, companyDescription, competitionId, internalClosingDate, externalClosingDate, payLevel, employmentType, travelFrequency, jobCategory, companyName, contactInformation, userId } = req.body;

    const query = `
        INSERT INTO jobs (jobTitle, numPeople, jobLocation, streetAddress, companyDescription, competitionId, internalClosingDate, externalClosingDate, payLevel, employmentType, travelFrequency, jobCategory, companyName, contactInformation, user_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.execute(query, [jobTitle, numPeople, jobLocation, streetAddress, companyDescription, competitionId, internalClosingDate, externalClosingDate, payLevel, employmentType, travelFrequency, jobCategory, companyName, contactInformation, userId], (err, results) => {
        if (err) {
            console.error('Error inserting job data:', err.stack);
            return res.status(500).json({ message: 'Error posting job.' });
        }

        const jobId = results.insertId;
        const selectQuery = 'SELECT * FROM jobs WHERE id = ?';
        db.execute(selectQuery, [jobId], (err, jobResults) => {
            if (err) {
                console.error('Error fetching job data:', err.stack);
                return res.status(500).json({ message: 'Error fetching job data.' });
            }
            res.json({ message: 'Job posted successfully!', job: jobResults[0] });
        });
    });
});

// Route to update a job by ID
app.put('/jobs/:jobId', (req, res) => {
    const { jobId } = req.params;
    const { jobTitle, numPeople, jobLocation, streetAddress, companyDescription, competitionId, internalClosingDate, externalClosingDate, payLevel, employmentType, travelFrequency, jobCategory, companyName, contactInformation } = req.body;

    const query = `
        UPDATE jobs 
        SET jobTitle = ?, numPeople = ?, jobLocation = ?, streetAddress = ?, companyDescription = ?, competitionId = ?, internalClosingDate = ?, externalClosingDate = ?, payLevel = ?, employmentType = ?, travelFrequency = ?, jobCategory = ?, companyName = ?, contactInformation = ? 
        WHERE id = ?
    `;

    db.execute(query, [jobTitle, numPeople, jobLocation, streetAddress, companyDescription, competitionId, internalClosingDate, externalClosingDate, payLevel, employmentType, travelFrequency, jobCategory, companyName, contactInformation, jobId], (err) => {
        if (err) {
            console.error('Error updating job:', err.stack);
            return res.status(500).json({ message: 'Error updating job.' });
        }
        res.json({ message: 'Job updated successfully!' });
    });
});

app.post('/admin/courses', (req, res) => {
    const { title, description, category } = req.body;
    
    const query = 'INSERT INTO courses (title, description, category) VALUES (?, ?, ?)';
    db.execute(query, [title, description, category], (err, results) => {
        if (err) {
            console.error('Error inserting course:', err.stack);
            return res.status(500).json({ message: 'Error adding course.' });
        }
        res.status(201).json({ message: 'Course added successfully!', courseId: results.insertId });
    });
});

// Fetch Courses Endpoint (Optional for Testing)
app.get('/courses', (req, res) => {
    const query = 'SELECT * FROM courses';
    db.execute(query, (err, results) => {
        if (err) {
            console.error('Error fetching courses:', err.stack);
            return res.status(500).json({ message: 'Error fetching courses.' });
        }
        res.json(results);
    });
});

app.get('/jobs/employer/:userId', (req, res) => {
    const userId = req.params.userId;

    const query = 'SELECT * FROM jobs WHERE user_id = ?';
    db.execute(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching jobs:', err.stack);
            return res.status(500).json({ message: 'Error fetching jobs.' });
        }
        res.json(results);
    });
});

// Route to get all jobs
app.get('/jobs', (req, res) => {
    const query = 'SELECT * FROM jobs';
    db.execute(query, (err, results) => {
        if (err) {
            console.error('Error fetching jobs:', err.stack);
            return res.status(500).json({ message: 'Error fetching jobs.' });
        }
        res.json(results);
    });
});

// Route to get a specific job by ID
app.get('/jobs/:jobId', (req, res) => {
    const { jobId } = req.params;

    const query = 'SELECT * FROM jobs WHERE id = ?';
    db.execute(query, [jobId], (err, results) => {
        if (err) {
            console.error('Error fetching job data:', err.stack);
            return res.status(500).json({ message: 'Error fetching job data.' });
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ message: 'Job not found.' });
        }
    });
});

// Route to delete a specific job by ID
app.delete('/jobs/:jobId', (req, res) => {
    const { jobId } = req.params;

    const query = 'DELETE FROM jobs WHERE id = ?';

    db.execute(query, [jobId], (err) => {
        if (err) {
            console.error('Error deleting job:', err.stack);
            return res.status(500).json({ message: 'Error deleting job.' });
        }
        res.json({ message: 'Job deleted successfully!' });
    });
});


// Route to handle job applications
app.post('/apply-job/:jobId', upload.fields([{ name: 'resume' }, { name: 'coverLetter' }]), async (req, res) => {
    try {
        // Capture jobId from the URL parameters
        const { jobId } = req.params;

        // Extract and parse the form data
        const {
            firstName,
            lastName,
            email,
            phoneNumber,
            address,
            position,
            desiredCompensation
        } = JSON.parse(req.body.formData);

        // Validate inputs
        if (!firstName || !lastName || !email || !phoneNumber || !address || !position || !desiredCompensation) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const resume = req.files['resume'] ? req.files['resume'][0] : null;
        const coverLetter = req.files['coverLetter'] ? req.files['coverLetter'][0] : null;

        // Upload the resume to Azure Blob Storage
        const resumePath = resume ? await uploadFileToAzure(resume.buffer, resume.originalname) : null;

        // Upload the cover letter to Azure Blob Storage, if provided
        const coverLetterPath = coverLetter ? await uploadFileToAzure(coverLetter.buffer, coverLetter.originalname) : null;

        // Insert application data into the database, including jobId
        const query = `
            INSERT INTO applications 
            (jobId, firstName, lastName, email, phoneNumber, address, position, desiredCompensation, resumePath, coverLetterPath) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.execute(query, [
            jobId,
            firstName,
            lastName,
            email,
            phoneNumber,
            address,
            position,
            desiredCompensation,
            resumePath,
            coverLetterPath
        ], (err, results) => {
            if (err) {
                console.error('Error inserting application data:', err.stack);
                return res.status(500).json({ message: 'Error applying for job.' });
            }
            res.json({ message: 'Application submitted successfully!' });
        });
    } catch (error) {
        console.error('Error processing job application:', error);
        res.status(500).json({ message: 'Error applying for job.' });
    }
});

// Route to get all applications for a specific job
app.get('/applications/job/:jobId', async (req, res) => {
    const { jobId } = req.params;
    const { userId } = req.query; // Get userId from query parameters

    if (!jobId || !userId) {
        return res.status(400).json({ message: 'Job ID and User ID are required.' });
    }

    try {
        // Query to ensure that the applications are fetched only for jobs posted by the user
        const query = `
            SELECT a.* FROM applications a
            JOIN jobs j ON a.jobId = j.id
            WHERE a.jobId = ? AND j.user_id = ?
        `;

        db.execute(query, [jobId, userId], (err, results) => {
            if (err) {
                console.error('Error fetching applications:', err.stack);
                return res.status(500).json({ message: 'Internal server error while fetching applications.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'No applications found for this job.' });
            }

            res.json(results);
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Route to get details of a specific application
app.get('/applications/:applicationId', async (req, res) => {
    const { applicationId } = req.params;
    const { userId } = req.query; // Optional: Get userId from query parameters for security

    if (!applicationId) {
        return res.status(400).json({ message: 'Application ID is required.' });
    }

    try {
        const query = `
            SELECT a.* FROM applications a
            JOIN jobs j ON a.jobId = j.id
            WHERE a.id = ? ${userId ? 'AND j.user_id = ?' : ''}
        `;

        const params = userId ? [applicationId, userId] : [applicationId];

        db.execute(query, params, (err, results) => {
            if (err) {
                console.error('Error fetching application details:', err.stack);
                return res.status(500).json({ message: 'Internal server error while fetching application details.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: 'Application not found.' });
            }

            res.json(results[0]);
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
});
  
// Example route for updating application status
app.patch('/applications/:applicationId/status', (req, res) => {
    const { applicationId } = req.params;
    const { status } = req.body;
  
    // Ensure the status is one of the allowed values
    if (!['Pending', 'Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }
  
    const query = 'UPDATE applications SET status = ? WHERE id = ?';
    db.execute(query, [status, applicationId], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating application status.' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Application not found.' });
      }
      res.json({ message: 'Application status updated successfully!' });
    });
  });
  

  // Route to fetch applied jobs for a user
app.get('/applied-jobs', async (req, res) => {
    try {
        const { userId } = req.query; // Assuming userId is passed as a query parameter

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        // Join applications with jobs to fetch detailed job information
        const query = `
            SELECT jobs.id AS jobId, jobs.title AS jobTitle, jobs.companyName, jobs.location AS jobLocation, 
                   applications.resumePath, applications.coverLetterPath, applications.applyDate
            FROM applications
            INNER JOIN jobs ON applications.jobId = jobs.id
            WHERE applications.userId = ?
        `;

        db.execute(query, [userId], (err, results) => {
            if (err) {
                console.error('Error fetching applied jobs:', err.stack);
                return res.status(500).json({ message: 'Error fetching applied jobs.' });
            }
            res.json(results);
        });
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ message: 'Error fetching applied jobs.' });
    }
});


// Route to fetch all employers
app.get('/employers', (req, res) => {
    const query = `
        SELECT employers.*, users.email 
        FROM employers 
        JOIN users ON employers.user_id = users.id
    `;

    db.execute(query, (err, results) => {
        if (err) {
            console.error('Error fetching employers:', err.stack);
            return res.status(500).json({ message: 'Error fetching employers.' });
        }
        res.json(results);
    });
});

// Route to fetch employer details including email from users table
app.get('/employers/:employerId', (req, res) => {
    const { employerId } = req.params;
    const query = `
        SELECT employers.*, users.email 
        FROM employers 
        JOIN users ON employers.user_id = users.id 
        WHERE employers.user_id = ?
    `;

    db.execute(query, [employerId], (err, results) => {
        if (err) {
            console.error('Error fetching employer details:', err.stack);
            return res.status(500).json({ message: 'Error fetching employer details.' });
        }
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ message: 'Employer not found.' });
        }
    });
});

// Route to fetch jobs posted by a specific employer
app.get('/employers/:employerId/jobs', (req, res) => {
    const { employerId } = req.params;
    const query = 'SELECT * FROM jobs WHERE user_id = ?';

    db.execute(query, [employerId], (err, results) => {
        if (err) {
            console.error('Error fetching jobs:', err.stack);
            return res.status(500).json({ message: 'Error fetching jobs.' });
        }
        res.json(results);
    });
});

app.get('/profile/:userId', (req, res) => {
    const { userId } = req.params;
    const query = 'SELECT users.id, users.userType, students.fullName, employers.companyName, admins.adminName FROM users LEFT JOIN students ON users.id = students.user_id LEFT JOIN employers ON users.id = employers.user_id LEFT JOIN admins ON users.id = admins.user_id WHERE users.id = ?';

    db.execute(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching profile data: ' + err.stack);
            res.status(500).send('Error fetching profile data.');
            return;
        }
        if (results.length > 0) {
            const { id, userType, fullName, companyName, adminName } = results[0];
            const name = fullName || companyName || adminName;
            res.json({ userId: id, userType, name });
        } else {
            res.status(404).send('User not found.');
        }
    });
});

// Fetch user statistics
app.get('/admin/user-stats', (req, res) => {
    const query = `
        SELECT 
            SUM(CASE WHEN userType = 'student' THEN 1 ELSE 0 END) as students,
            SUM(CASE WHEN userType = 'employer' THEN 1 ELSE 0 END) as employers,
            SUM(CASE WHEN userType = 'admin' THEN 1 ELSE 0 END) as admins
        FROM users
    `;

    db.execute(query, (err, results) => {
        if (err) {
            console.error('Error fetching user stats:', err.stack);
            return res.status(500).json({ message: 'Error fetching user stats.' });
        }
        res.json(results[0]);
    });
});

// Fetch active courses count
app.get('/admin/active-courses', (req, res) => {
    const query = 'SELECT COUNT(*) as activeCourses FROM courses WHERE isActive = 1';

    db.execute(query, (err, results) => {
        if (err) {
            console.error('Error fetching active courses:', err.stack);
            return res.status(500).json({ message: 'Error fetching active courses.' });
        }
        res.json(results[0]);
    });
});

  
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
