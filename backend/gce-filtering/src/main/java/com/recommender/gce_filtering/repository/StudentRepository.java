package com.recommender.gce_filtering.repository;

import com.recommender.gce_filtering.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    // Inherits standard CRUD methods like save(), findAll(), and findById()
}