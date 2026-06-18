package com.recommender.gce_filtering.repository;

import com.recommender.gce_filtering.entity.ExamRecord;
import com.recommender.gce_filtering.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExamRecordRepository extends JpaRepository<ExamRecord, Long> {
    // Fetches all scores belonging to a specific student profile
    List<ExamRecord> findByStudent(Student student);
}