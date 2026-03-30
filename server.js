const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Models
const Student = require('./models/Student');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/collegeDB')
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


// ================= ROUTES =================

// Register
app.post('/register', async (req, res) => {
  const student = new Student(req.body);
  await student.save();
  res.json({ message: "Registered Successfully" });
});

// Login
app.post('/login', async (req, res) => {
  const user = await Student.findOne({
    email: req.body.email,
    password: req.body.password
  });

  if (user) {
    res.json({
      success: true,
      message: "Login Successful",
      user: {
        id: user._id,
        firstName: user.name,
        email: user.email
      }
    });
  } else {
    res.json({
      success: false,
      message: "Invalid Credentials"
    });
  }
});

// Get Courses
app.get('/courses', async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
});

// Enroll
app.post('/enroll', async (req, res) => {
  const enrollment = new Enrollment(req.body);
  await enrollment.save();
  res.json({ message: "Enrolled Successfully" });
});
// ================= UPDATE =================

// Update Student Profile
app.put('/student/:id', async (req, res) => {
  try {
    const updatedUser = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        email: req.body.email
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile Updated Successfully",
      user: updatedUser
    });
  } catch (err) {
    res.json({
      success: false,
      message: "Update Failed"
    });
  }
});

// Delete Enrollment (Drop Course)
app.delete('/enroll/:id', async (req, res) => {
  await Enrollment.findByIdAndDelete(req.params.id);
  res.json({ message: "Enrollment Deleted" });
});
// Start Server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});