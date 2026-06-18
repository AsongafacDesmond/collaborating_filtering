package com.recommender.gce_filtering.dto;

import java.util.Map;

public class StrengthInputDTO {
    public String studentName; 
    
    // CHANGED: Use String for the key to match incoming JSON structure perfectly
    public Map<String, Integer> subjectScores; 
}