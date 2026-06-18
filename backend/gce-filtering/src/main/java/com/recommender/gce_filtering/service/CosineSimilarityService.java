package com.recommender.gce_filtering.service;

import org.springframework.stereotype.Service;

@Service
public class CosineSimilarityService {

    /**
     * Calculates the cosine similarity index between two numeric vector arrays.
     * Formula: cos(θ) = (A · B) / (||A|| * ||B||)
     */
    public double calculateSimilarity(int[] vectorA, int[] vectorB) {
        if (vectorA == null || vectorB == null || vectorA.length != vectorB.length || vectorA.length == 0) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }

        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}