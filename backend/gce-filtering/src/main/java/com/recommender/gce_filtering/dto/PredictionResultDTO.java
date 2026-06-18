package com.recommender.gce_filtering.dto;

import java.util.List;
import java.util.Map;

public class PredictionResultDTO {
    public String recommendedTrack;
    public String similarityScore;
    public String basedOnCandidate;
    
    // Lists to support the dynamic map loops in your React UI panels
    public List<Map<String, Object>> similarities; 
    public List<SubjectPredictionDTO> predictions;
    
    // Vector representations for the geometric trace at the bottom of the UI
    public List<Integer> userVector;
    public List<Integer> matchVector;
}