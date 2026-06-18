package com.recommender.gce_filtering.service;

import com.recommender.gce_filtering.entity.Subject;
import com.recommender.gce_filtering.repository.SubjectRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final SubjectRepository subjectRepository;

    public DataInitializer(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Only seed data if the table is completely empty
        if (subjectRepository.count() == 0) {
            System.out.println("🌱 Database is empty! Seeding GCE Subject Metadata...");

            // 1. Seed Baseline Subjects (The sliders on your React frontend)
            saveSubject("Mathematics", true);
            saveSubject("Physics", true);
            saveSubject("Chemistry", true);
            saveSubject("Computer Science", true);
            saveSubject("English Language", true);

            // 2. Seed Target Subjects (The ones your collaborative filtering model predicts)
            saveSubject("Further Mathematics", false);
            saveSubject("Software Engineering Introduction", false);
            saveSubject("Numerical Analysis Concepts", false);

            System.out.println("✅ Database seeding complete!");
        }
    }

    private void saveSubject(String name, boolean isBaseline) {
        Subject subject = new Subject();
        subject.setSubjectName(name);
        
        // FIXED: Using the matching setter name from your Subject entity class
        subject.setBaseline(isBaseline); 
        
        subjectRepository.save(subject);
    }
}