package com.recommender.gce_filtering.entity;

import jakarta.persistence.*;
import java.util.*;

@Entity
@Table(name = "students")
public class Student {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    // Links the student to their rows in the exam_records table
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<ExamRecord> examRecords = new ArrayList<>();

    // Default Constructor
    public Student() {}

    // Parameterized Constructor
    public Student(String name) {
        this.name = name;
    }

    // Standard Getters and Setters
    public Long getId() { 
        return id; 
    }

    public void setId(Long id) { 
        this.id = id; 
    }

    public String getName() { 
        return name; 
    }

    public void setName(String name) { 
        this.name = name; 
    }

    public List<ExamRecord> getExamRecords() { 
        return examRecords; 
    }

    public void setExamRecords(List<ExamRecord> examRecords) { 
        this.examRecords = examRecords; 
    }

    /**
     * DYNAMIC PIVOT MATRIX HELPER
     * This method converts a student's list of exam records into a 
     * Key-Value Map where Key = Subject ID (String) and Value = Score (Integer).
     * * Example output: {"1": 85, "2": 75, "4": 90}
     * Any missing subject ID will automatically render as a "?" in the UI grid.
     */
    public Map<String, Integer> getScoresMap() {
        Map<String, Integer> scores = new HashMap<>();
        if (examRecords != null) {
            for (ExamRecord record : examRecords) {
                if (record.getSubject() != null) {
                    scores.put(String.valueOf(record.getSubject().getId()), record.getScore());
                }
            }
        }
        return scores;
    }
}