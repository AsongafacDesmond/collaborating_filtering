package com.recommender.gce_filtering.repository;

import com.recommender.gce_filtering.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {
    // Custom database query helpers for our N-subject algorithm layout
    List<Subject> findByIsBaselineTrue();
    List<Subject> findByIsBaselineFalse();
}