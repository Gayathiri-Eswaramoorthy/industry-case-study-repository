package com.icr.backend.course.service.impl;

import com.icr.backend.course.entity.Course;
import com.icr.backend.course.repository.CourseRepository;
import com.icr.backend.course.service.CourseService;
import com.icr.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;

    @Override
    public Course createCourse(String courseCode, String courseName, User createdBy) {

        if (courseRepository.existsByCourseCode(courseCode)) {
            throw new RuntimeException("Course code already exists");
        }

        Course course = Course.builder()
                .courseCode(courseCode)
                .courseName(courseName)
                .createdBy(createdBy)
                .build();

        return courseRepository.save(course);
    }

    @Override
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @Override
    public List<Course> getCoursesByCreatedBy(User createdBy) {
        return courseRepository.findByCreatedBy(createdBy);
    }
}
