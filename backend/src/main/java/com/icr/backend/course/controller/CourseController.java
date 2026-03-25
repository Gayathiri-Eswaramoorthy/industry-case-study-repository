package com.icr.backend.course.controller;

import com.icr.backend.course.dto.CourseResponse;
import com.icr.backend.course.entity.Course;
import com.icr.backend.course.service.CourseService;
import com.icr.backend.entity.User;
import com.icr.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public CourseResponse createCourse(@RequestParam String courseCode,
                                       @RequestParam String courseName) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User createdBy = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Course course = courseService.createCourse(courseCode, courseName, createdBy);
        return CourseResponse.fromEntity(course);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public List<CourseResponse> getAllCourses() {
        // Show all existing courses to all authenticated roles.
        return courseService.getAllCourses()
                .stream()
                .map(CourseResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
