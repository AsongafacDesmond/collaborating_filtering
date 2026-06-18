package com.recommender.gce_filtering.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "subjects")
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String subjectName;

    // True if used as input (e.g. Math, Physics), False if it is a target to be predicted (e.g. Further Math)
    @Column(nullable = false)
    private boolean isBaseline; 

    // Standard Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    
    public boolean isBaseline() { return isBaseline; }
    public void setBaseline(boolean baseline) { this.isBaseline = baseline; }

    //  ALIAS SETTER: This prevents compilation errors in DataInitializer/PredictionService
    public void setIsBaseline(boolean isBaseline) {
        this.isBaseline = isBaseline;
    }
}