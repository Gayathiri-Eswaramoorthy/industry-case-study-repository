package com.icr.backend.course.controller;

import com.icr.backend.course.entity.Course;
import com.icr.backend.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Course createCourse(@RequestParam String courseCode,
                               @RequestParam String courseName) {
        return courseService.createCourse(courseCode, courseName);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public List<Course> getAllCourses() {
        return courseService.getAllCourses();
    }
}