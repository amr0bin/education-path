// private.js — the transcript inventory. Grades only; no identifiers.
// Keep this file out of a public repository (see README). The site works without it.
// Source: Emily Carr University of Art + Design unofficial transcript, printed 13 Oct 2026; 4.0 scale.
window.EDU.transcript = {
  institution: "Emily Carr University of Art + Design",
  degree: "BFA, Visual Arts (awarded 2005)",
  scale: "4.0",
  credits: 135,
  cgpa: 3.13,
  // 300/400-level courses only: 51 credits, 150.0 grade points
  senior: { credits: 51, gpa: 2.94 },
  // most recent 60 credits (2003 SP partial → 2005 FA), weighted
  last60: { gpa: 2.97 },
  seniorAcredits: 3, // AHIS 410 (A) — none in psychology, education or counselling
  // What the transcript holds against the six prerequisites
  prerequisites: [
    ["Counselling theories", "None"], ["Interviewing / helping skills", "None"], ["Statistics / research methods", "None"],
    ["Abnormal psychology", "None"], ["Learning or cognitive psychology", "None (SCIE 201 Vision & Perception is 200-level and not on the table)"],
    ["Developmental psychology (SFU)", "None"],
  ],
  // Senior-level courses on the record, for the GPA arithmetic
  seniorCourses: [
    ["DRWG 302", "B+", 3], ["DRWG 310", "B", 3], ["AHIS 333", "B-", 3], ["PNTG 310", "B-", 6],
    ["HUMN 411", "B", 3], ["AHIS 320", "B+", 3], ["HUMN 311", "B+", 3], ["DRWG 309", "B", 3],
    ["GEVA 410", "C", 6], ["GEVA 410", "B", 3], ["GEVA 410", "B-", 3], ["AHIS 404", "B", 3],
    ["AHIS 325", "B+", 3], ["AHIS 410", "A", 3], ["SOCS 411", "B", 3],
  ],
};
