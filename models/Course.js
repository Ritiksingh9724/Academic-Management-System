const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  courseName: String,
  courseCode: String
});

module.exports = mongoose.model('Course', CourseSchema);