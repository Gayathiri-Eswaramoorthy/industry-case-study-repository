package com.icr.backend.course.service;

import com.icr.backend.course.entity.Course;
import com.icr.backend.entity.User;

import java.util.List;

public interface CourseService {

    Course createCourse(String courseCode, String courseName, User createdBy);

    List<Course> getAllCourses();

    List<Course> getCoursesByCreatedBy(User createdBy);
}
