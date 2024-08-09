require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const { v1: uuidv1 } = require('uuid');
const { uploadFileToAzure } = require('./azureStorage'); // Import from azureStorage.js
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
    const query = 'INSERT INTO users (email, password, userType) VALUES (?, ?, ?)';

    db.execute(query, [email, password, userType], (err, results) => {
        if (err) {
            console.error('Error inserting data: ' + err.stack);
            res.status(500).send('Error signing up.');
            return;
        }
        const userId = results.insertId;
        if (userType === 'student') {
            const studentQuery = 'INSERT INTO students (user_id, fullName, studentNumber) VALUES (?, ?, ?)';
            db.execute(studentQuery, [userId, fullName, studentNumber], (err) => {
                if (err) {
                    console.error('Error inserting student data: ' + err.stack);
                    res.status(500).send('Error signing up.');
                    return;
                }
                res.json({ userId, userType, fullName });
            });
        } else if (userType === 'employer') {
            const employerQuery = 'INSERT INTO employers (user_id, companyName, companyAddress) VALUES (?, ?, ?)';
            db.execute(employerQuery, [userId, companyName, companyAddress], (err) => {
                if (err) {
                    console.error('Error inserting employer data: ' + err.stack);
                    res.status(500).send('Error signing up.');
                    return;
                }
                res.json({ userId, userType, companyName });
            });
        }
    });
});

app.post('/profile/:userId', (req, res) => {
    const { userId } = req.params;
    const {
        fullName, personalStatement, skills, education, experience, resume
    } = req.body;

    console.log('Data received on server:', req.body); // Log the incoming data

    const skillsString = skills.join(', ');

    const updateProfileQuery = `
        UPDATE students 
        SET fullName = ?, personalStatement = ?, skills = ?, education = ?, experience = ?, resume = ?
        WHERE user_id = ?
    `;

    db.execute(updateProfileQuery, [fullName, personalStatement, skillsString, education, experience, resume, userId], (err, results) => {
        if (err) {
            console.error('Error updating profile:', err.stack);
            return res.status(500).send('Error updating profile.');
        }
        console.log('Update query results:', results); 
        res.json({ message: 'Profile updated successfully!' });
    });
});



app.post('/courses-taken', (req, res) => {
    const { userId, courseName } = req.body;

    const insertCourseQuery = `
        INSERT INTO courses_taken (user_id, courseName)
        VALUES (?, ?)
    `;

    db.execute(insertCourseQuery, [userId, courseName], (err, results) => {
        if (err) {
            console.error('Error adding course:', err.stack);
            res.status(500).send('Error adding course.');
            return;
        }
        res.json({ message: 'Course added successfully!' });
    });
});

app.post('/jobs-applied', (req, res) => {
    const { userId, jobId, companyName, jobTitle } = req.body;

    const insertJobQuery = `
        INSERT INTO jobs_applied (user_id, jobTitle, companyName)
        VALUES (?, ?, ?)
    `;

    db.execute(insertJobQuery, [userId, jobTitle, companyName], (err, results) => {
        if (err) {
            console.error('Error adding job application:', err.stack);
            res.status(500).send('Error adding job application.');
            return;
        }
        res.json({ message: 'Job application recorded successfully!' });
    });
});


app.post('/post-job', (req, res) => {
    const {
        jobTitle,
        numPeople,
        jobLocation,
        streetAddress,
        jobDescription,
        competitionId,
        internalClosingDate,
        externalClosingDate,
        payLevel,
        employmentType,
        travelFrequency,
        jobCategory,
        companyName,
        contactInformation,
        userId
    } = req.body;

    // Format the dates before storing them
    const formattedInternalClosingDate = new Date(internalClosingDate).toLocaleDateString('en-CA');
    const formattedExternalClosingDate = new Date(externalClosingDate).toLocaleDateString('en-CA');

    const query = `
        INSERT INTO jobs (jobTitle, numPeople, jobLocation, streetAddress, jobDescription, competitionId, internalClosingDate, externalClosingDate, payLevel, employmentType, travelFrequency, jobCategory, companyName, contactInformation, user_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.execute(query, [
        jobTitle,
        numPeople,
        jobLocation,
        streetAddress,
        jobDescription,
        competitionId,
        formattedInternalClosingDate, // Use formatted date
        formattedExternalClosingDate, // Use formatted date
        payLevel,
        employmentType,
        travelFrequency,
        jobCategory,
        companyName,
        contactInformation,
        userId
    ], (err, results) => {
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

            // Format the dates again before sending them to the client
            const job = jobResults[0];
            job.internalClosingDate = new Date(job.internalClosingDate).toLocaleDateString('en-CA');
            job.externalClosingDate = new Date(job.externalClosingDate).toLocaleDateString('en-CA');

            res.json({ message: 'Job posted successfully!', job: job });
        });
    });
});

app.put('/jobs/:jobId', (req, res) => {
    const { jobId } = req.params;
    const { jobTitle, numPeople, jobLocation, streetAddress, jobDescription, competitionId, internalClosingDate, externalClosingDate, payLevel, employmentType, travelFrequency, jobCategory, companyName, contactInformation } = req.body;

    const query = `
        UPDATE jobs 
        SET jobTitle = ?, numPeople = ?, jobLocation = ?, streetAddress = ?, jobDescription = ?, competitionId = ?, internalClosingDate = ?, externalClosingDate = ?, payLevel = ?, employmentType = ?, travelFrequency = ?, jobCategory = ?, companyName = ?, contactInformation = ? 
        WHERE id = ?
    `;

    db.execute(query, [jobTitle, numPeople, jobLocation, streetAddress, jobDescription, competitionId, internalClosingDate, externalClosingDate, payLevel, employmentType, travelFrequency, jobCategory, companyName, contactInformation, jobId], (err) => {
        if (err) {
            console.error('Error updating job:', err.stack);
            return res.status(500).json({ message: 'Error updating job.' });
        }
        res.json({ message: 'Job updated successfully!' });
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
app.post('/apply-job', upload.fields([{ name: 'resume' }, { name: 'coverLetter' }]), async (req, res) => {
    try {
        // Extract and parse the form data
        const {
            jobId,
            userId,
            personalInfo,
            education,
            experience,
            positionDetails
        } = JSON.parse(req.body.formData);

        // Validate inputs
        if (!jobId || !userId || !personalInfo || !education || !experience || !positionDetails) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // Extract resume and cover letter from the files array
        const resume = req.files['resume'] ? req.files['resume'][0] : null;
        const coverLetter = req.files['coverLetter'] ? req.files['coverLetter'][0] : null;

        // Upload the resume to Azure Blob Storage
        const resumeUrl = resume ? await uploadFileToAzure(resume.buffer, resume.originalname) : null;

        // Upload the cover letter to Azure Blob Storage, if provided
        const coverLetterUrl = coverLetter ? await uploadFileToAzure(coverLetter.buffer, coverLetter.originalname) : null;

        // Insert application data into the database
        const query = `
            INSERT INTO applications 
            (jobId, userId, resumePath, coverLetterPath, personalInfo, education, experience, positionDetails) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Execute the database query
        db.execute(query, [
            jobId,
            userId,
            resumeUrl,
            coverLetterUrl,
            JSON.stringify(personalInfo),   // Store personalInfo as a JSON string
            JSON.stringify(education),      // Store education as a JSON string
            JSON.stringify(experience),     // Store experience as a JSON string
            JSON.stringify(positionDetails) // Store positionDetails as a JSON string
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

// Route to handle fetching job applications for an employer
app.get('/applications/:employerId', (req, res) => {
    const employerId = req.params.employerId;

    const query = `
        SELECT applications.*, jobs.jobTitle, users.email 
        FROM applications 
        JOIN jobs ON applications.jobId = jobs.id 
        JOIN users ON applications.userId = users.id 
        WHERE jobs.user_id = ?
    `;

    db.execute(query, [employerId], (err, results) => {
        if (err) {
            console.error('Error fetching applications:', err.stack);
            return res.status(500).json({ message: 'Error fetching applications.' });
        }

        // Parse JSON strings back into objects for easier front-end processing
        const applications = results.map(application => ({
            ...application,
            personalInfo: JSON.parse(application.personalInfo),
            education: JSON.parse(application.education),
            experience: JSON.parse(application.experience),
            positionDetails: JSON.parse(application.positionDetails)
        }));

        res.json(applications);
    });
});

// Route to handle fetching application details
app.get('/applications/details/:applicationId', (req, res) => {
    const { applicationId } = req.params;

    const query = `
        SELECT applications.*, users.email, jobs.jobTitle 
        FROM applications 
        JOIN users ON applications.userId = users.id 
        JOIN jobs ON applications.jobId = jobs.id 
        WHERE applications.id = ?
    `;

    db.execute(query, [applicationId], (err, results) => {
        if (err) {
            console.error('Error fetching application details:', err.stack);
            return res.status(500).json({ message: 'Error fetching application details.' });
        }
        if (results.length > 0) {
            // Parse JSON strings back into objects for easier front-end processing
            const application = results[0];
            application.personalInfo = JSON.parse(application.personalInfo);
            application.education = JSON.parse(application.education);
            application.experience = JSON.parse(application.experience);
            application.positionDetails = JSON.parse(application.positionDetails);
            res.json(application);
        } else {
            res.status(404).json({ message: 'Application not found.' });
        }
    });
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
    const profileQuery = `
        SELECT users.email, students.fullName, students.personalStatement, students.skills, students.education, students.experience, 
               students.resume 
        FROM users 
        LEFT JOIN students ON users.id = students.user_id 
        WHERE users.id = ?
    `;

    const coursesQuery = `
        SELECT courseName 
        FROM courses_taken 
        WHERE user_id = ?
    `;

    const jobsAppliedQuery = `
        SELECT jobTitle, companyName 
        FROM jobs_applied 
        WHERE user_id = ?
    `;

    // Fetch profile information
    db.execute(profileQuery, [userId], (err, profileResults) => {
        if (err) {
            console.error('Error fetching profile data:', err.stack);
            res.status(500).send('Error fetching profile data.');
            return;
        }

        if (profileResults.length === 0) {
            res.status(404).send('User not found.');
            return;
        }
        console.log('Profile data fetched:', profileResults[0])
        const profile = profileResults[0];

        // Fetch courses taken
        db.execute(coursesQuery, [userId], (err, coursesResults) => {
            if (err) {
                console.error('Error fetching courses:', err.stack);
                res.status(500).send('Error fetching courses.');
                return;
            }

            // Fetch jobs applied
            db.execute(jobsAppliedQuery, [userId], (err, jobsResults) => {
                if (err) {
                    console.error('Error fetching jobs applied:', err.stack);
                    res.status(500).send('Error fetching jobs applied.');
                    return;
                }

                res.json({
                    ...profile,
                    courses: coursesResults,
                    jobsApplied: jobsResults
                });
            });
        });
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

// Fetch recent activities
app.get('/admin/recent-activities', (req, res) => {
    const query = `
        SELECT 
            activityType as description, 
            users.email as userEmail, 
            activityTimestamp as timestamp 
        FROM activities 
        JOIN users ON activities.userId = users.id 
        ORDER BY activityTimestamp DESC 
        LIMIT 10
    `;

    db.execute(query, (err, results) => {
        if (err) {
            console.error('Error fetching recent activities:', err.stack);
            return res.status(500).json({ message: 'Error fetching recent activities.' });
        }
        res.json({ activities: results });
    });
});

// Route to fetch all users
app.get('/users', (req, res) => {
    const query = `
        SELECT 
            users.id, users.email, users.userType, 
            students.fullName, students.studentNumber,
            employers.companyName,
            admins.adminName
        FROM users
        LEFT JOIN students ON users.id = students.user_id
        LEFT JOIN employers ON users.id = employers.user_id
        LEFT JOIN admins ON users.id = admins.user_id
    `;

    db.execute(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err.stack);
            return res.status(500).json({ message: 'Error fetching users.' });
        }
        res.json(results);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
