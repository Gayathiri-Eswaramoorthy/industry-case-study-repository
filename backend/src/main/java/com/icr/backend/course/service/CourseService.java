package com.icr.backend.course.service;

import com.icr.backend.course.entity.Course;

import java.util.List;

public interface CourseService {

    Course createCourse(String courseCode, String courseName);

    List<Course> getAllCourses();
}
