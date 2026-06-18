# GCE Predictive Recommender Performance Engine

An integrated, data-driven web platform designed to analyze academic score trajectories and provide optimal Advanced Level academic path alignments for General Certificate of Education (GCE) candidates. 

The system leverages a core **User-Item Collaborative Filtering** framework via Cosine Similarity vector metrics to contrast incoming candidate parameters against historical student performance registries and dynamically project outcome weights across unmapped academic target paths.

---

## 🏗️ Monorepo Directory Layout

```text
collaborating_filtering/
├── backend/              # Spring Boot 3 REST API Core
│   ├── src/              # System Logic (JPA Entities, Filtering Controllers, Algorithms)
│   └── pom.xml           # Maven Project Dependencies Management
└── frontend/             # React 18 / Vite Presentation Client
    ├── src/              # Interactive UI Layouts, Sparsity Matrices, Dashboards
    └── package.json      # Node Package Configuration
