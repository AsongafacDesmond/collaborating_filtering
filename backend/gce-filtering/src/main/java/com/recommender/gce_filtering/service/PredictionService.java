

// package com.recommender.gce_filtering.service;

// import com.recommender.gce_filtering.dto.*; 
// import com.recommender.gce_filtering.entity.*;
// import com.recommender.gce_filtering.repository.*;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.stereotype.Service;
// import org.springframework.transaction.annotation.Transactional;

// import java.util.*;
// import java.util.stream.Collectors;

// @Service
// public class PredictionService {

//     @Autowired
//     private StudentRepository studentRepository;

//     @Autowired
//     private SubjectRepository subjectRepository;

//     @Autowired
//     private ExamRecordRepository examRecordRepository;

//     @Autowired
//     private CosineSimilarityService similarityService;

//     // Define K - how many similar neighbors to average out
//     private static final int K_NEIGHBORS = 3;

//     @Transactional
//     public PredictionResultDTO generateGcePredictions(StrengthInputDTO input) {
        
//         // STEP 1: Persist the new student & their input slider scores
//         Student newStudent = new Student();
//         newStudent.setName(input.studentName == null || input.studentName.trim().isEmpty() ? "Anonymous Candidate" : input.studentName);
//         newStudent = studentRepository.save(newStudent);

//         List<Subject> baselineSubjects = subjectRepository.findByIsBaselineTrue();
//         List<Subject> targetSubjects = subjectRepository.findByIsBaselineFalse();

//         if (baselineSubjects.isEmpty()) {
//             throw new RuntimeException("No configuration metadata present for Baseline Subjects in database.");
//         }

//         List<Integer> activeUserVectorList = new ArrayList<>();
//         for (Subject subject : baselineSubjects) {
//             int score = input.subjectScores.getOrDefault(String.valueOf(subject.getId()), 0);
            
//             ExamRecord record = new ExamRecord();
//             record.setStudent(newStudent);
//             record.setSubject(subject);
//             record.setScore(score);
//             examRecordRepository.save(record);

//             activeUserVectorList.add(score);
//         }

//         int[] userVector = activeUserVectorList.stream().mapToInt(Integer::intValue).toArray();

//         // 🌟 STEP 2: Vector Scan & Calculate Similarities for ALL historical students
//         List<Student> historicalStudents = studentRepository.findAll();
//         List<NeighborMatch> neighborsList = new ArrayList<>();
//         List<Map<String, Object>> similaritiesDashboardList = new ArrayList<>();

//         for (Student historyStudent : historicalStudents) {
//             if (historyStudent.getId().equals(newStudent.getId())) continue;

//             int[] candidateVector = new int[baselineSubjects.size()];
//             List<ExamRecord> historyRecords = examRecordRepository.findByStudent(historyStudent);
            
//             for (int i = 0; i < baselineSubjects.size(); i++) {
//                 Long subId = baselineSubjects.get(i).getId();
//                 candidateVector[i] = historyRecords.stream()
//                         .filter(r -> r.getSubject().getId().equals(subId))
//                         .mapToInt(ExamRecord::getScore)
//                         .findFirst()
//                         .orElse(0);
//             }

//             double currentSim = similarityService.calculateSimilarity(userVector, candidateVector);
            
//             // Avoid adding negative or division-by-zero errors to the cluster space
//             if (currentSim < 0 || Double.isNaN(currentSim)) {
//                 currentSim = 0.0;
//             }

//             // Keep track of internal data structures for K-NN sorting
//             neighborsList.add(new NeighborMatch(historyStudent, currentSim, historyRecords));

//             // Format for frontend graph view visualization
//             Map<String, Object> candidateMap = new HashMap<>();
//             candidateMap.put("name", historyStudent.getName());
//             candidateMap.put("similarity", Math.round(currentSim * 100.0) / 100.0);
//             similaritiesDashboardList.add(candidateMap);
//         }

//         // Sort similarities for the React UI ranking board
//         similaritiesDashboardList.sort((a, b) -> Double.compare((Double) b.get("similarity"), (Double) a.get("similarity")));

//         // Sort our neighborhood dataset descending by closeness metric
//         neighborsList.sort((n1, n2) -> Double.compare(n2.similarity, n1.similarity));

//         // Slice top K matches safely
//         List<NeighborMatch> topKNeighbors = neighborsList.stream()
//                 .limit(K_NEIGHBORS)
//                 .collect(Collectors.toList());

//         // 🌟 STEP 3: Compute Target Projections using K-NN Weighted Average
//         List<SubjectPredictionDTO> predictionsList = new ArrayList<>();
//         int primaryTargetScoreSum = 0;

//         // If no past data exists, create a default fallback cluster
//         if (topKNeighbors.isEmpty()) {
//             NeighborMatch fallback = new NeighborMatch(newStudent, 1.0, new ArrayList<>());
//             topKNeighbors.add(fallback);
//         }

//         for (Subject targetSub : targetSubjects) {
//             final Long targetId = targetSub.getId();
            
//             double weightedScoreSum = 0.0;
//             double totalSimilarityWeight = 0.0;

//             for (NeighborMatch neighbor : topKNeighbors) {
//                 int historicalTargetScore = neighbor.records.stream()
//                         .filter(r -> r.getSubject().getId().equals(targetId))
//                         .mapToInt(ExamRecord::getScore)
//                         .findFirst()
//                         .orElse(50); // Median baseline fallback

//                 // Weight the score by how identical the student is to Desmond
//                 weightedScoreSum += (historicalTargetScore * neighbor.similarity);
//                 totalSimilarityWeight += neighbor.similarity;
//             }

//             // Avoid division by zero if all weights are zero
//             int projectedScore = 50;
//             if (totalSimilarityWeight > 0) {
//                 projectedScore = (int) Math.min(100, Math.round(weightedScoreSum / totalSimilarityWeight));
//             }

//             primaryTargetScoreSum += projectedScore;

//             predictionsList.add(new SubjectPredictionDTO(
//                     targetSub.getSubjectName(), 
//                     projectedScore, 
//                     translateToGceGrade(projectedScore)
//             ));
//         }

//         // 🌟 STEP 4: Format output mapping matrices
//         PredictionResultDTO result = new PredictionResultDTO();
        
//         // Show the top neighbor's statistics for dashboard metrics summary cards
//         double maxSimilarity = neighborsList.isEmpty() ? 1.0 : neighborsList.get(0).similarity;
//         result.similarityScore = String.valueOf(Math.round(maxSimilarity * 100.0) / 100.0);
//         result.basedOnCandidate = neighborsList.isEmpty() ? "Cluster Pool Average" : neighborsList.get(0).student.getName();
        
//         result.similarities = similaritiesDashboardList;
//         result.predictions = predictionsList;
//         result.userVector = activeUserVectorList;

//         // Construct match vector tracking from top neighbor node
//         List<Integer> matchVectorList = new ArrayList<>();
//         if (!neighborsList.isEmpty()) {
//             List<ExamRecord> topNeighborRecords = neighborsList.get(0).records;
//             for (Subject sub : baselineSubjects) {
//                 matchVectorList.add(topNeighborRecords.stream()
//                         .filter(r -> r.getSubject().getId().equals(sub.getId()))
//                         .mapToInt(ExamRecord::getScore)
//                         .findFirst()
//                         .orElse(0));
//             }
//         } else {
//             matchVectorList = activeUserVectorList;
//         }
//         result.matchVector = matchVectorList;

//         // Track classification allocation logic
//         double averageTarget = targetSubjects.isEmpty() ? 0 : (double) primaryTargetScoreSum / targetSubjects.size();
//         if (averageTarget >= 70) {
//             result.recommendedTrack = "Pure Sciences & Mathematics Group";
//         } else if (averageTarget >= 50) {
//             result.recommendedTrack = "Technology / Engineering Group";
//         } else {
//             result.recommendedTrack = "Arts & Humanities Alignment Group";
//         }

//         return result;
//     }

//     private String translateToGceGrade(int score) {
//         if (score >= 80) return "A";
//         if (score >= 70) return "B";
//         if (score >= 60) return "C";
//         if (score >= 50) return "D";
//         if (score >= 40) return "E";
//         return "F";
//     }

//     // A clean private helper class to handle internal sorting calculations smoothly
//     private static class NeighborMatch {
//         Student student;
//         double similarity;
//         List<ExamRecord> records;

//         NeighborMatch(Student student, double similarity, List<ExamRecord> records) {
//             this.student = student;
//             this.similarity = similarity;
//             this.records = records;
//         }
//     }
// }
package com.recommender.gce_filtering.service;

import com.recommender.gce_filtering.dto.*; 
import com.recommender.gce_filtering.entity.*;
import com.recommender.gce_filtering.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PredictionService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private ExamRecordRepository examRecordRepository;

    @Autowired
    private CosineSimilarityService similarityService;

    private static final int K_NEIGHBORS = 3;

    @Transactional
    public PredictionResultDTO generateGcePredictions(StrengthInputDTO input) {
        
        // STEP 1: Persist the new student & their input slider scores
        Student newStudent = new Student();
        newStudent.setName(input.studentName == null || input.studentName.trim().isEmpty() ? "Anonymous Candidate" : input.studentName);
        newStudent = studentRepository.save(newStudent);

        List<Subject> baselineSubjects = subjectRepository.findByIsBaselineTrue();
        List<Subject> targetSubjects = subjectRepository.findByIsBaselineFalse();

        if (baselineSubjects.isEmpty()) {
            throw new RuntimeException("No configuration metadata present for Baseline Subjects in database.");
        }

        List<Integer> activeUserVectorList = new ArrayList<>();
        int userBaselineSum = 0;
        
        for (Subject subject : baselineSubjects) {
            int score = input.subjectScores.getOrDefault(String.valueOf(subject.getId()), 0);
            userBaselineSum += score;
            
            ExamRecord record = new ExamRecord();
            record.setStudent(newStudent);
            record.setSubject(subject);
            record.setScore(score);
            examRecordRepository.save(record);

            activeUserVectorList.add(score);
        }

        int[] userVector = activeUserVectorList.stream().mapToInt(Integer::intValue).toArray();
        int userBaselineAverage = userBaselineSum / baselineSubjects.size();

        // STEP 2: Vector Scan & Calculate Similarities for ALL historical students
        List<Student> historicalStudents = studentRepository.findAll();
        List<NeighborMatch> neighborsList = new ArrayList<>();
        List<Map<String, Object>> similaritiesDashboardList = new ArrayList<>();

        for (Student historyStudent : historicalStudents) {
            if (historyStudent.getId().equals(newStudent.getId())) continue;

            int[] candidateVector = new int[baselineSubjects.size()];
            List<ExamRecord> historyRecords = examRecordRepository.findByStudent(historyStudent);
            
            int neighborBaselineSum = 0;
            int baselineCount = 0;

            for (int i = 0; i < baselineSubjects.size(); i++) {
                Long subId = baselineSubjects.get(i).getId();
                int score = historyRecords.stream()
                        .filter(r -> r.getSubject().getId().equals(subId))
                        .mapToInt(ExamRecord::getScore)
                        .findFirst()
                        .orElse(0);
                
                candidateVector[i] = score;
                if (score > 0) {
                    neighborBaselineSum += score;
                    baselineCount++;
                }
            }

            int neighborBaselineAverage = baselineCount > 0 ? (neighborBaselineSum / baselineCount) : 50;

            double currentSim = similarityService.calculateSimilarity(userVector, candidateVector);
            
            if (currentSim < 0 || Double.isNaN(currentSim)) {
                currentSim = 0.0;
            }

            neighborsList.add(new NeighborMatch(historyStudent, currentSim, historyRecords, neighborBaselineAverage));

            Map<String, Object> candidateMap = new HashMap<>();
            candidateMap.put("name", historyStudent.getName());
            candidateMap.put("similarity", Math.round(currentSim * 100.0) / 100.0);
            similaritiesDashboardList.add(candidateMap);
        }

        similaritiesDashboardList.sort((a, b) -> Double.compare((Double) b.get("similarity"), (Double) a.get("similarity")));
        neighborsList.sort((n1, n2) -> Double.compare(n2.similarity, n1.similarity));

        List<NeighborMatch> topKNeighbors = neighborsList.stream()
                .limit(K_NEIGHBORS)
                .collect(Collectors.toList());

        // STEP 3: Compute Target Projections using Mean-Centered Normalization (Relative Scaling)
        List<SubjectPredictionDTO> predictionsList = new ArrayList<>();
        int primaryTargetScoreSum = 0;

        if (topKNeighbors.isEmpty()) {
            NeighborMatch fallback = new NeighborMatch(newStudent, 1.0, new ArrayList<>(), userBaselineAverage);
            topKNeighbors.add(fallback);
        }

        for (Subject targetSub : targetSubjects) {
            final Long targetId = targetSub.getId();
            
            double weightedDeviationSum = 0.0;
            double totalSimilarityWeight = 0.0;

            for (NeighborMatch neighbor : topKNeighbors) {
                // Find explicit mark in this specific column cell
                Optional<ExamRecord> explicitRecord = neighbor.records.stream()
                        .filter(r -> r.getSubject().getId().equals(targetId))
                        .findFirst();

                // TRUE SPARSITY CHECK: Only compute if the neighbor has a real mark (> 0) recorded
                if (explicitRecord.isPresent() && explicitRecord.get().getScore() > 0) {
                    double historicalTargetScore = (double) explicitRecord.get().getScore();
                    
                    // Calculate relative performance deviation from neighbor's baseline mean
                    double deviationFromAverage = historicalTargetScore - neighbor.averageBaselineStrength;
                    
                    // Accumulate weighted deviation variations using floating decimals
                    weightedDeviationSum += (deviationFromAverage * neighbor.similarity);
                    totalSimilarityWeight += neighbor.similarity;
                }
            }

            // Target prediction scales proportionally up or down relative to the active user's baseline tier
            int projectedScore = userBaselineAverage;
            if (totalSimilarityWeight > 0) {
                double avgWeightedDeviation = weightedDeviationSum / totalSimilarityWeight;
                projectedScore = (int) Math.min(100, Math.max(0, Math.round(userBaselineAverage + avgWeightedDeviation)));
            }

            primaryTargetScoreSum += projectedScore;

            predictionsList.add(new SubjectPredictionDTO(
                    targetSub.getSubjectName(), 
                    projectedScore, 
                    translateToGceGrade(projectedScore)
            ));
        }

        // STEP 4: Format output mapping matrices
        PredictionResultDTO result = new PredictionResultDTO();
        
        double maxSimilarity = neighborsList.isEmpty() ? 1.0 : neighborsList.get(0).similarity;
        result.similarityScore = String.valueOf(Math.round(maxSimilarity * 100.0) / 100.0);
        result.basedOnCandidate = neighborsList.isEmpty() ? "Cluster Pool Average" : neighborsList.get(0).student.getName();
        
        result.similarities = similaritiesDashboardList;
        result.predictions = predictionsList;
        result.userVector = activeUserVectorList;

        List<Integer> matchVectorList = new ArrayList<>();
        if (!neighborsList.isEmpty()) {
            List<ExamRecord> topNeighborRecords = neighborsList.get(0).records;
            for (Subject sub : baselineSubjects) {
                matchVectorList.add(topNeighborRecords.stream()
                        .filter(r -> r.getSubject().getId().equals(sub.getId()))
                        .mapToInt(ExamRecord::getScore)
                        .findFirst()
                        .orElse(0));
            }
        } else {
            matchVectorList = activeUserVectorList;
        }
        result.matchVector = matchVectorList;

        double averageTarget = targetSubjects.isEmpty() ? 0 : (double) primaryTargetScoreSum / targetSubjects.size();
        if (averageTarget >= 70) {
            result.recommendedTrack = "Pure Sciences & Mathematics Group";
        } else if (averageTarget >= 50) {
            result.recommendedTrack = "Technology / Engineering Group";
        } else {
            result.recommendedTrack = "Arts & Humanities Alignment Group";
        }

        return result;
    }

    private String translateToGceGrade(int score) {
        if (score >= 80) return "A";
        if (score >= 70) return "B";
        if (score >= 60) return "C";
        if (score >= 50) return "D";
        if (score >= 40) return "E";
        return "F";
    }

    private static class NeighborMatch {
        Student student;
        double similarity;
        List<ExamRecord> records;
        int averageBaselineStrength;

        NeighborMatch(Student student, double similarity, List<ExamRecord> records, int averageBaselineStrength) {
            this.student = student;
            this.similarity = similarity;
            this.records = records;
            this.averageBaselineStrength = averageBaselineStrength;
        }
    }
}