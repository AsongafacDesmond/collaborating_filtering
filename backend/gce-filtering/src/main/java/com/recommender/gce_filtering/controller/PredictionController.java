package com.recommender.gce_filtering.controller;

import com.recommender.gce_filtering.dto.StrengthInputDTO;
import com.recommender.gce_filtering.dto.PredictionResultDTO;
import com.recommender.gce_filtering.service.PredictionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173") 
public class PredictionController {

    @Autowired
    private PredictionService predictionService;

    @PostMapping("/recommend")
    public ResponseEntity<PredictionResultDTO> getRecommendations(@RequestBody StrengthInputDTO inputPayload) {
        PredictionResultDTO computedReport = predictionService.generateGcePredictions(inputPayload);
        return ResponseEntity.ok(computedReport);
    }
}