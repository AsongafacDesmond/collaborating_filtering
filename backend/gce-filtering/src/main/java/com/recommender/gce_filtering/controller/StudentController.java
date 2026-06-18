package com.recommender.gce_filtering.controller;

import com.recommender.gce_filtering.entity.*;
import com.recommender.gce_filtering.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000") // Allows your React frontend to connect without CORS blocks
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private ExamRecordRepository examRecordRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    /**
     * GET /api/students
     * Fetches all registered students and packages their marks into a structured matrix.
     * Missing or unmapped records will safely omit their keys, displaying as a gray "?" in React.
     */
    @GetMapping("/students")
    public ResponseEntity<List<Map<String, Object>>> getAllStudentsForMatrix() {
        List<Student> students = studentRepository.findAll();
        List<Map<String, Object>> matrixData = new ArrayList<>();

        for (Student student : students) {
            Map<String, Object> row = new HashMap<>();
            row.put("id", student.getId());
            row.put("name", student.getName());
            
            // Uses the getScoresMap() helper from your Student entity to convert rows to {"1": 85, "2": 70}
            row.put("scores", student.getScoresMap()); 
            
            matrixData.add(row);
        }
        return ResponseEntity.ok(matrixData);
    }

    /**
     * POST /api/matrix/update
     * Receives an explicit payload whenever an admin types a mark into a grid cell.
     * Updates an existing entry or initializes a new cell link dynamically.
     */
    @PostMapping("/matrix/update")
    public ResponseEntity<?> updateMatrixCell(@RequestBody Map<String, Object> payload) {
        try {
            Long studentId = Long.valueOf(payload.get("studentId").toString());
            Long subjectId = Long.valueOf(payload.get("subjectId").toString());
            int score = Integer.parseInt(payload.get("score").toString());

            // 1. Locate Core Entities
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student profile not found with ID: " + studentId));
            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new RuntimeException("Subject profile not found with ID: " + subjectId));

            // 2. Scan for an existing cell record to overwrite, otherwise instantiate a clean one
            List<ExamRecord> records = examRecordRepository.findByStudent(student);
            ExamRecord record = records.stream()
                    .filter(r -> r.getSubject().getId().equals(subjectId))
                    .findFirst()
                    .orElse(new ExamRecord());

            // 3. Map values and commit to the database transaction pool
            record.setStudent(student);
            record.setSubject(subject);
            record.setScore(score);
            examRecordRepository.save(record);

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Matrix cell synchronization complete.");
            return ResponseEntity.ok().body(response);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}