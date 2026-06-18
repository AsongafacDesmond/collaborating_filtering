
package com.recommender.gce_filtering.dto;

public class SubjectPredictionDTO {
    public String subjectName;
    public int predictedScore;
    public String gceGrade;

    // Default Constructor
    public SubjectPredictionDTO() {}

    // Parameterized Constructor
    public SubjectPredictionDTO(String subjectName, int predictedScore, String gceGrade) {
        this.subjectName = subjectName;
        this.predictedScore = predictedScore;
        this.gceGrade = gceGrade;
    }
}