package com.recommender.gce_filtering.controller;

import com.recommender.gce_filtering.dto.LoginRequestDTO;
import com.recommender.gce_filtering.entity.SystemUser;
import com.recommender.gce_filtering.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        Optional<SystemUser> userOpt = userRepository.findByUsername(request.username);

        if (userOpt.isPresent() && userOpt.get().getPassword().equals(request.password)) {
            // Login successful! Send a confirmation back to React
            return ResponseEntity.ok(Map.of(
                "success", true,
                "username", userOpt.get().getUsername(),
                "message", "Authentication verified successfully."
            ));
        }

        // Login failed
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("success", false, "message", "Invalid username or password!"));
    }
}