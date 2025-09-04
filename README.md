# Mock Interview PoC


To get started, take a look at src/app/page.tsx.

- Document Upload: Allow users to paste resume and job descriptions.
- Information Extraction: Automatically extract relevant information from the uploaded resume and job description using NLP techniques.
- Question Generation: Generate a set of ~10 interview questions tailored to the candidate's resume and the specific job requirements. Use LLM to decide which concepts from both sources need to be explored using tool.
- Virtual Interview Simulation: Simulate a real interview experience with a demo interviewer video and the candidate's live camera feed, with two-second delays after clicking.
- Verbal Question Delivery: Deliver interview questions audibly through simulated interviewer's voice, creating a realistic interview environment. Questions are not shown visually.
- Response Processing & Follow-Up: Process the candidate's spoken answers in real-time and, when necessary, generate relevant follow-up questions.
- Camera View: Capture real-time audio from the user microphone to analyze and generate real-time, verbal follow up questions.

