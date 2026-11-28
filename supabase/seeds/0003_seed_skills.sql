-- Seed data for public.skills (44 L0 public-safe skills)

BEGIN;

WITH target_profile AS (
  SELECT id
  FROM public.profile
  WHERE slug = 'main'
)
INSERT INTO public.skills (
  profile_id,
  name,
  category,
  proficiency,
  proof_text,
  display_order,
  updated_at
)
SELECT
  target_profile.id,
  seed.name,
  seed.category,
  seed.proficiency,
  seed.proof_text,
  seed.display_order,
  now()
FROM target_profile
CROSS JOIN (
  VALUES
    ('Java', 'language', 84::smallint, 'Earned Oracle Certified Professional: Java SE 21 Developer certification and built Java applications using Spring Boot, including EventMate AI and Friday.', 1),
    ('Python', 'language', 76::smallint, 'Developed backend services with Python during a backend internship and applied it to the BlockSafe hackathon project.', 2),
    ('JavaScript', 'language', 72::smallint, 'Built React.js components using JavaScript during The Entrepreneurship Network internship, contributing to 28 components across 8 routes.', 3),
    ('TypeScript', 'language', 70::smallint, 'Used TypeScript with React to develop the frontend of EventMate AI during the Infosys Springboard training internship.', 4),
    ('C++', 'language', 55::smallint, 'Applied C++ fundamentals through academic coursework in object-oriented programming and data structures.', 5),
    ('SQL', 'language', 72::smallint, 'Used SQL for relational database operations and PostgreSQL-backed application development across projects.', 6),
    ('Spring Boot', 'framework', 80::smallint, 'Developed Java backend applications using Spring Boot, including EventMate AI and the Friday CLI assistant.', 7),
    ('FastAPI', 'framework', 78::smallint, 'Developed authentication, user-management and REST API services using FastAPI during backend internship work.', 8),
    ('React.js', 'framework', 75::smallint, 'Built 28 JSX components across 8 routes during The Entrepreneurship Network internship and developed the EventMate AI frontend.', 9),
    ('Tailwind CSS', 'framework', 70::smallint, 'Implemented responsive UI styling for the TEN Tech Competition Engine during internship work and used Tailwind CSS in EventMate AI.', 10),
    ('Spring Security', 'framework', 70::smallint, 'Configured Spring Security 6 to implement stateless authentication and role-based access control in EventMate AI.', 11),
    ('Spring AI', 'framework', 60::smallint, 'Integrated Spring AI to support AI-assisted event description generation in EventMate AI.', 12),
    ('PostgreSQL', 'database', 76::smallint, 'Used PostgreSQL for relational data persistence, database queries, connection pooling and application data management.', 13),
    ('Supabase', 'tool', 70::smallint, 'Used Supabase PostgreSQL connectivity and its Shared Pooler for backend database access.', 14),
    ('Docker', 'tool', 65::smallint, 'Used Docker to package application components for deployment, including EventMate AI and BlockSafe.', 15),
    ('Git', 'tool', 80::smallint, 'Used Git for version control, collaborative development and resolving merge conflicts across parallel branches.', 16),
    ('GitHub', 'tool', 80::smallint, 'Maintained and collaborated on software projects using GitHub repositories and source-control workflows.', 17),
    ('Postman', 'tool', 65::smallint, 'Used Postman to test and validate backend REST API endpoints during application development.', 18),
    ('REST API Development', 'concept_pattern', 78::smallint, 'Developed backend endpoints for authentication, user management, event workflows and external API integrations.', 19),
    ('JWT Authentication', 'concept_pattern', 76::smallint, 'Implemented stateless JWT authentication using Spring Security 6 and backend authentication workflows.', 20),
    ('Role-Based Access Control (RBAC)', 'concept_pattern', 75::smallint, 'Implemented role-based authorisation to restrict application functionality according to user permissions.', 21),
    ('Object-Oriented Programming', 'concept_pattern', 78::smallint, 'Applied object-oriented programming principles through Java application development and Java SE 21 certification preparation.', 22),
    ('Data Structures & Algorithms', 'concept_pattern', 72::smallint, 'Solved more than 200 LeetCode problems while practising data structures, algorithm design and problem-solving patterns.', 23),
    ('Database Design', 'concept_pattern', 68::smallint, 'Designed and worked with PostgreSQL relational schemas supporting application data and booking workflows.', 24),
    ('Connection Pooling', 'concept_pattern', 70::smallint, 'Migrated backend database connectivity to Supabase Shared Pooler using asyncpg, contributing to an approximately 34% reduction in warm cloud response time.', 25),
    ('TTL Caching', 'concept_pattern', 60::smallint, 'Implemented time-to-live caching to reduce repeated backend operations and improve response latency.', 26),
    ('API Rate Limiting', 'concept_pattern', 65::smallint, 'Implemented API request rate limiting using SlowAPI in a FastAPI backend.', 27),
    ('Optimistic Locking', 'concept_pattern', 68::smallint, 'Implemented JPA @Version optimistic locking with retry handling to prevent double-booking during simultaneous seat reservations in EventMate AI.', 28),
    ('ChatGPT', 'ai_tool', 85::smallint, 'Used ChatGPT for technical learning, problem-solving, research synthesis, writing refinement and iterative project planning.', 29),
    ('Google Gemini', 'ai_tool', 80::smallint, 'Used Gemini for research, document analysis, technical exploration and evaluating AI workflow architectures.', 30),
    ('Claude', 'ai_tool', 75::smallint, 'Used Claude for technical reasoning, code-related discussions, research synthesis and structured problem analysis.', 31),
    ('Google Antigravity', 'ai_tool', 65::smallint, 'Explored agent-assisted software development and structured coding workflows using Google Antigravity.', 32),
    ('OpenAI Codex', 'ai_tool', 60::smallint, 'Explored AI coding-agent workflows for repository-level development and software engineering tasks.', 33),
    ('Visual Studio Code', 'developer_tool', 85::smallint, 'Used Visual Studio Code as a development environment for programming, project development and AI-assisted workflows.', 34),
    ('GitHub Copilot', 'ai_tool', 50::smallint, 'Explored AI-powered code completion and development assistance through GitHub Copilot.', 35),
    ('Prompt Engineering', 'ai_concept', 78::smallint, 'Iteratively designed and refined prompts to obtain structured, context-aware responses for technical research, learning and development tasks.', 36),
    ('Context Engineering', 'ai_concept', 72::smallint, 'Designed reusable context instructions, AGENTS.md guidance, skill files and compact context references to improve consistency across AI sessions.', 37),
    ('Multi-Model Workflows', 'ai_concept', 75::smallint, 'Used ChatGPT, Gemini and Claude for different stages of research, analysis, validation and synthesis rather than relying on a single model.', 38),
    ('AI-Assisted Software Development', 'ai_concept', 72::smallint, 'Incorporated AI coding assistants into software development while reviewing generated output and retaining responsibility for technical decisions.', 39),
    ('AI Research & Output Evaluation', 'ai_concept', 78::smallint, 'Compared AI-generated recommendations, challenged assumptions and sought supporting evidence before accepting technical decisions.', 40),
    ('Agentic Workflow Design', 'ai_concept', 58::smallint, 'Explored reusable agent skills, tool access, workflow orchestration and human approval boundaries for multi-step AI tasks.', 41),
    ('Model Context Protocol (MCP)', 'ai_concept', 55::smallint, 'Studied MCP architecture and explored connecting AI clients with external tools through reusable server configurations.', 42),
    ('Retrieval-Augmented Generation (RAG)', 'ai_concept', 35::smallint, 'Studied document chunking, embeddings and retrieval concepts as foundations for building grounded AI applications.', 43),
    ('Large Language Model Fundamentals', 'ai_concept', 40::smallint, 'Studied LLM behaviour, tokens, context windows, inference and model limitations as foundations for AI engineering.', 44)
) AS seed(name, category, proficiency, proof_text, display_order)
ON CONFLICT (profile_id, name) DO UPDATE SET
  category = EXCLUDED.category,
  proficiency = EXCLUDED.proficiency,
  proof_text = EXCLUDED.proof_text,
  display_order = EXCLUDED.display_order,
  updated_at = now();

COMMIT;
