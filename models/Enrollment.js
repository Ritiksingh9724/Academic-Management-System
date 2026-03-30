const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  studentId: String,
  courseId: String
});

module.exports = mongoose.model('Enrollment', EnrollmentSchema);