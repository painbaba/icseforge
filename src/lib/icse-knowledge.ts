// ICSE Knowledge Base Seed Data
// This is the curated, prompt-engineering-grounded knowledge base that makes our agents
// "ICSE-aware" without needing model training. Loaded once into DB at startup.
//
// Categories:
//   - syllabus: official ICSE Class 10 syllabus summaries per subject
//   - specimen_pattern: question paper structure, mark distribution, time
//   - past_paper: representative past questions (sample)
//   - project_exemplar: high-quality ICSE project format example
//   - glossary: key terms per chapter
//   - rubric: ICSE internal assessment marking criteria

export interface SeedChunk {
  subject: string;
  className: string;
  category: string;
  chapter: string;
  title: string;
  content: string;
  tags: string;
  source: string;
}

export const ICSE_SEED: SeedChunk[] = [
  // ====================== PHYSICS ======================
  {
    subject: 'Physics', className: '10', category: 'syllabus', chapter: 'All',
    title: 'ICSE Class 10 Physics Syllabus Overview',
    content: `ICSE Class 10 Physics syllabus (CISCE board) covers the following units:
1. Force, Work, Power and Energy — moments, machines (lever, pulley, inclined plane), work-energy theorem, principle of conservation of energy.
2. Machines (Mechanical Advantage, Velocity Ratio, Efficiency).
3. Refraction of Light at Plane Surfaces — refractive index, real and apparent depth, lateral displacement.
4. Refraction Through Lens — converging/diverging lens, lens formula, magnification, power of lens.
5. Spectrum — deviation through prism, electromagnetic spectrum, infrared/UV applications.
6. Sound — reflection, echoes, natural vibrations, forced vibrations, resonance, loudness/pitch/quality.
7. Current Electricity — Ohm's law, series/parallel circuits, electrical power, household circuits.
8. Electro-Magnetism — magnetic effect of current, DC motor, electromagnetic induction, transformer.
9. Heat — calorimetry, specific heat, latent heat, Conduction, Convection, Radiation.
10. Modern Physics — radioactivity, nuclear fission and fusion, nuclear energy.
Internal Assessment: 20 marks (practical work and project). Theory paper: 80 marks, 2 hours.`,
    tags: 'physics,syllabus,class10,cisce', source: 'manual'
  },
  {
    subject: 'Physics', className: '10', category: 'specimen_pattern', chapter: 'All',
    title: 'ICSE Physics Paper Pattern',
    content: `ICSE Physics Theory Paper (Paper 1): 80 marks, 2 hours.
Section A (40 marks): Compulsory short-answer questions covering the entire syllabus. Question 1 usually has 10 sub-parts of 1 mark each (multiple choice / very short answer). Remaining questions in Section A are 2-3 marks each.
Section B (40 marks): 6 long-answer questions of 5 marks each. Candidates answer any 4. Questions test derivations, numerical problems, ray diagrams, circuit diagrams, definitions with examples.
Internal Assessment (20 marks): 10 marks for practical file + 10 marks for project work and viva-voce.`,
    tags: 'physics,paper-pattern,marks', source: 'manual'
  },
  {
    subject: 'Physics', className: '10', category: 'project_exemplar', chapter: 'General',
    title: 'ICSE Physics Project Exemplar Format',
    content: `Standard ICSE Physics project format (used for Class 10 internal assessment):
COVER PAGE: Project title, student name, class, roll number, subject, school, year, guide teacher.
CERTIFICATE: "This is to certify that ___ of Class 10 has completed this project under my supervision."
ACKNOWLEDGEMENT: Brief thanks to teacher, principal, parents.
OBJECTIVE / AIM: 1-2 clear sentences stating what the project investigates.
INTRODUCTION: Background theory (200-300 words).
MATERIALS / APPARATUS: Bulleted list with quantities.
THEORY: Relevant formulae, laws, definitions.
PROCEDURE: Numbered steps describing experiment.
OBSERVATIONS: Tabulated readings with proper units and significant figures.
CALCULATIONS: Worked-out formulae with substitution.
RESULT / CONCLUSION: Stated clearly with units, comparison with expected value.
PRECAUTIONS: 4-5 bullet points.
SOURCES OF ERROR: 2-3 bullets.
BIBLIOGRAPHY: Textbook + internet sources.
Diagrams: neat, labeled, in pencil or pen, drawn on the left page of the file.`,
    tags: 'physics,project,format,exemplar', source: 'manual'
  },
  {
    subject: 'Physics', className: '10', category: 'glossary', chapter: 'Machines',
    title: 'Machines — Key Terms',
    content: `Mechanical Advantage (MA) = Load / Effort. Ideal MA = Velocity Ratio.
Velocity Ratio (VR) = distance moved by effort / distance moved by load. Depends only on machine geometry.
Efficiency (η) = (MA / VR) × 100%. Always < 100% due to friction.
Lever: rigid bar pivoted at fulcrum. Three classes based on position of fulcrum, load, effort.
Pulley: single fixed pulley (MA=1, VR=1, used to change direction); single movable pulley (MA=2, VR=2); block and tackle (MA = number of rope segments supporting load).
Inclined Plane: VR = length of slope / height of plane.`,
    tags: 'physics,machines,ma,vr,efficiency', source: 'manual'
  },

  // ====================== CHEMISTRY ======================
  {
    subject: 'Chemistry', className: '10', category: 'syllabus', chapter: 'All',
    title: 'ICSE Class 10 Chemistry Syllabus Overview',
    content: `ICSE Class 10 Chemistry syllabus:
1. Periodic Properties and Variations of Properties — periodic table, atomic size, ionization potential, electron affinity, electronegativity.
2. Chemical Bonding — electrovalent, covalent, coordinate bonds; formation of molecules.
3. Study of Acids, Bases and Salts — Arrhenius, Bronsted-Lowry; pH; indicators; salt hydrolysis.
4. Analytical Chemistry — use of NH4OH, NaOH; identification of cations/anions.
5. Mole Concept and Stoichiometry — Gay-Lussac's law, Avogadro's law, molar volume, percentage composition, empirical formula.
6. Electrolysis — electrolytes, electrodes, preferential discharge; industrial applications (electroplating, refining).
7. Metallurgy — extraction of aluminum, zinc, iron; reactivity series.
8. Study of Compounds — HCl, NH3, HNO3, H2SO4; preparation, properties, uses.
9. Organic Chemistry — alkanes, alkenes, alkynes; alcohols, carboxylic acids; isomerism.
Theory: 80 marks, 2 hours. Internal assessment: 20 marks.`,
    tags: 'chemistry,syllabus,class10', source: 'manual'
  },
  {
    subject: 'Chemistry', className: '10', category: 'specimen_pattern', chapter: 'All',
    title: 'ICSE Chemistry Paper Pattern',
    content: `ICSE Chemistry Theory Paper: 80 marks, 2 hours.
Section A (40 marks): compulsory. Q1: 10 sub-parts of 1 mark each (MCQ / fill-in / very short). Q2-Q5: short answers of 2-5 marks. Covers entire syllabus.
Section B (40 marks): 6 questions of 5 marks each, attempt any 4. Each question often has sub-parts (a), (b), (c) testing definitions, equations, reasoning, and observation-based answers.
Frequent question types: balanced equations, identifying compounds from observations, reasons for trends, mole calculations, electrolysis diagrams, organic reaction sequences.`,
    tags: 'chemistry,paper-pattern,marks', source: 'manual'
  },
  {
    subject: 'Chemistry', className: '10', category: 'project_exemplar', chapter: 'General',
    title: 'ICSE Chemistry Project Exemplar Format',
    content: `ICSE Chemistry project file format:
COVER PAGE → CERTIFICATE → ACKNOWLEDGEMENT → INDEX → AIM/OBJECTIVE → INTRODUCTION → MATERIALS REQUIRED → CHEMICAL THEORY (relevant equations, laws, definitions) → PROCEDURE (numbered, with observations) → OBSERVATION TABLE → CALCULATIONS → RESULT → PRECAUTIONS → CONCLUSION → BIBLIOGRAPHY.
Common project topics: study of acidity in fruits/vegetables, rate of rusting under different conditions, saponification, electrolysis of water, analysis of fertilizers, study of cola drinks pH, foaming capacity of soaps.`,
    tags: 'chemistry,project,format', source: 'manual'
  },

  // ====================== BIOLOGY ======================
  {
    subject: 'Biology', className: '10', category: 'syllabus', chapter: 'All',
    title: 'ICSE Class 10 Biology Syllabus Overview',
    content: `ICSE Class 10 Biology syllabus:
1. Basic Biology — cell structure, cell organelles, tissues.
2. Plant Physiology — absorption of water and minerals, transpiration, photosynthesis (light and dark reactions), chemical equation.
3. Human Anatomy and Physiology — circulatory system (heart, blood vessels, blood), respiratory system, excretory system, nervous system (brain, spinal cord, reflex arc), endocrine system.
4. Population — population explosion, consequences, birth control methods.
5. Human Evolution — theories of evolution (Darwin, Lamarck), evidences.
6. Pollution — air, water, soil, noise pollution; causes, effects, control.
Theory: 80 marks, 2 hours. Internal assessment: 20 marks.`,
    tags: 'biology,syllabus,class10', source: 'manual'
  },
  {
    subject: 'Biology', className: '10', category: 'project_exemplar', chapter: 'General',
    title: 'ICSE Biology Project Exemplar Format',
    content: `ICSE Biology project format:
COVER PAGE → CERTIFICATE → ACKNOWLEDGEMENT → INDEX → AIM → INTRODUCTION → MATERIALS → THEORY (definitions, biological concepts) → PROCEDURE (with diagrammatic representation) → OBSERVATIONS (tables/photographs/diagrams) → DISCUSSION → CONCLUSION → BIBLIOGRAPHY.
Biology projects require neat labeled diagrams (use pencil for sketch, pen for labels). Common topics: effect of light on photosynthesis, transpiration rates in different plants, heart rate variability, study of food chains in local ecosystem, water pollution analysis, study of soil types.`,
    tags: 'biology,project,format', source: 'manual'
  },

  // ====================== MATHEMATICS ======================
  {
    subject: 'Mathematics', className: '10', category: 'syllabus', chapter: 'All',
    title: 'ICSE Class 10 Mathematics Syllabus Overview',
    content: `ICSE Class 10 Mathematics syllabus:
1. Commercial Mathematics — GST, banking (recurring deposit), shares and dividends.
2. Algebra — linear equations, quadratic equations, factor theorem, remainder theorem, matrices, arithmetic & geometric progressions, coordinate geometry (section formula, slope, equation of line).
3. Geometry — similarity of triangles, circles (tangent properties, chord properties, angle properties), construction of tangents and circumscribed/escribed circles.
4. Mensuration — cylinder, cone, sphere; area and volume.
5. Trigonometry — ratios, identities, heights and distances.
6. Statistics — mean, median, mode, histogram, ogive, quartiles.
7. Probability — simple events, complementary events, sample space.
Theory: 80 marks, 2.5 hours. Internal assessment: 20 marks.`,
    tags: 'mathematics,syllabus,class10', source: 'manual'
  },
  {
    subject: 'Mathematics', className: '10', category: 'specimen_pattern', chapter: 'All',
    title: 'ICSE Mathematics Paper Pattern',
    content: `ICSE Mathematics Theory Paper: 80 marks, 2.5 hours.
Section A (40 marks): Compulsory. Q1: 10 sub-parts of 1 mark (MCQ, very short). Q2-Q5: 3 marks each.
Section B (40 marks): 7 questions of 4-5 marks each, attempt any 4. Often involves multi-step problems, proofs, constructions, graph-based questions.
Frequent: prove identities, solve quadratic equations, find equation of line, construct triangle/circle, find mean/median from given data, trigonometric heights-and-distances word problems.`,
    tags: 'mathematics,paper-pattern', source: 'manual'
  },

  // ====================== HISTORY & CIVICS ======================
  {
    subject: 'History', className: '10', category: 'syllabus', chapter: 'All',
    title: 'ICSE Class 10 History & Civics Syllabus',
    content: `ICSE History & Civics (Paper 1):
CIVICS: (1) The Union Legislature — Lok Sabha, Rajya Sabha. (2) The Union Executive — President, Vice President, Prime Minister, Council of Ministers. (3) The Judiciary — Supreme Court, High Courts, District Courts.
HISTORY: (1) The First War of Independence (1857). (2) Growth of Nationalism. (3) First Phase of Indian National Movement (1885-1907). (4) Second Phase of Indian National Movement (1905-1916). (5) Muslim League. (6) Mahatma Gandhi and National Movement. (7) Independence and Partition of India. (8) First World War, Rise of Dictatorships, Second World War. (9) United Nations, Major Agencies. (10) Non-Aligned Movement.
Theory: 80 marks, 2 hours. Internal assessment: 20 marks.`,
    tags: 'history,civics,syllabus', source: 'manual'
  },
  {
    subject: 'History', className: '10', category: 'project_exemplar', chapter: 'General',
    title: 'ICSE History Project Format',
    content: `ICSE History/Civics project format:
COVER PAGE → CERTIFICATE → ACKNOWLEDGEMENT → INDEX → AIM/OBJECTIVE → INTRODUCTION → MAIN CONTENT (sub-headed, chronologically ordered, with dates and names) → PICTURES/MAPS/CHARTS (with captions and sources) → CONCLUSION → BIBLIOGRAPHY.
Use primary sources where possible (newspapers, letters, photographs). Projects should analyze, not just describe. Cite all images and quotes.
Common topics: Role of Mahatma Gandhi in freedom struggle, Causes and consequences of 1857 revolt, Functions of Lok Sabha, UN and its agencies, Non-Aligned Movement.`,
    tags: 'history,project,format', source: 'manual'
  },

  // ====================== GEOGRAPHY ======================
  {
    subject: 'Geography', className: '10', category: 'syllabus', chapter: 'All',
    title: 'ICSE Class 10 Geography Syllabus',
    content: `ICSE Geography (Paper 2):
1. Interpretation of Topographical Maps — 1:50,000 scale, contour reading, drainage patterns.
2. Map of India — physical features, climate, soils, vegetation.
3. Climate — factors affecting, monsoon, distribution of rainfall.
4. Soil Resources — types, conservation.
5. Natural Vegetation — types, conservation.
6. Water Resources — irrigation, multipurpose projects.
7. Mineral Resources — iron, coal, petroleum, manganese, bauxite.
8. Agriculture — types, rice, wheat, sugarcane, cotton, jute, tea, coffee.
9. Industries — iron and steel, cotton textile, sugar, IT.
10. Transport — roads, railways, airways, waterways.
11. Waste Management — e-waste, biomedical, nuclear.
Theory: 80 marks, 2 hours. Internal assessment: 20 marks.`,
    tags: 'geography,syllabus', source: 'manual'
  },

  // ====================== ENGLISH ======================
  {
    subject: 'English', className: '10', category: 'syllabus', chapter: 'All',
    title: 'ICSE Class 10 English Syllabus',
    content: `ICSE English (Paper 1: English Language, Paper 2: Literature in English):
ENGLISH LANGUAGE (80 marks, 2 hours):
- Composition (250-300 words, 20 marks): narrative, descriptive, argumentative.
- Letter (formal/informal, 20 marks).
- Notice / Email / Report writing (10 marks).
- Unseen comprehension passage (20 marks).
- Grammar (10 marks): tenses, prepositions, conjunctions, voice, direct-indirect.
LITERATURE (80 marks, 2 hours):
- Drama: The Merchant of Venice (Shakespeare).
- Poetry: selected poems from anthology.
- Prose: selected short stories from anthology.
Internal assessment (20 marks): listening, speaking, writing portfolio.`,
    tags: 'english,syllabus', source: 'manual'
  },

  // ====================== COMPUTER APPLICATIONS ======================
  {
    subject: 'Computer', className: '10', category: 'syllabus', chapter: 'All',
    title: 'ICSE Class 10 Computer Applications Syllabus',
    content: `ICSE Computer Applications (Java):
1. Revision of Class 9 — concepts, operators, input/output.
2. Class as the Basis of All Computation — class, object, attributes, methods, constructor.
3. Constructors — default, parameterized, overloaded.
4. Functions — pure, impure, library, user-defined.
5. Class as a Reference Type — object references, passing objects.
6. Encapsulation — access specifiers.
7. Arrays — single and two-dimensional.
8. Input/Output — Scanner class.
9. Library Classes — String, Math, wrapper classes.
10. Iteration — for, while, do-while.
11. String manipulation methods.
Theory: 50 marks, 2 hours. Internal assessment: 50 marks (project + practical file).`,
    tags: 'computer,java,syllabus', source: 'manual'
  },
  {
    subject: 'Computer', className: '10', category: 'project_exemplar', chapter: 'General',
    title: 'ICSE Computer Project Format',
    content: `ICSE Computer Applications project format:
COVER PAGE → CERTIFICATE → ACKNOWLEDGEMENT → INDEX → PROBLEM STATEMENT → ANALYSIS (inputs, outputs, processes) → ALGORITHM → VARIABLE DESCRIPTION TABLE → SOURCE CODE (with comments) → OUTPUT SCREENSHOTS → LIMITATIONS → CONCLUSIONS → BIBLIOGRAPHY.
Common project topics: student management system, library management, temperature converter, palindrome/prime checker, employee payroll calculator, banking system, quiz application. Must use classes, constructors, methods, Scanner input, proper exception handling.`,
    tags: 'computer,project,format', source: 'manual'
  },

  // ====================== ECONOMICS ======================
  {
    subject: 'Economics', className: '10', category: 'syllabus', chapter: 'All',
    title: 'ICSE Class 10 Economics Syllabus',
    content: `ICSE Economics:
1. Demand and Supply — law of demand, elasticity, law of supply.
2. Market — perfect competition, monopoly, monopolistic competition.
3. Factors of Production — land, labor, capital, entrepreneur.
4. Major Theories — utility, indifference curve (basic).
5. Money and Banking — functions of money, central bank, commercial banks.
6. Inflation — types, causes, effects, control measures.
7. Public Finance — public revenue, expenditure, budget, taxes (direct/indirect, GST).
8. National Income — GDP, GNP, NNP, per capita income.
Theory: 80 marks, 2 hours. Internal assessment: 20 marks.`,
    tags: 'economics,syllabus', source: 'manual'
  },

  // ====================== CROSS-CUTTING ======================
  {
    subject: 'General', className: '10', category: 'rubric', chapter: 'All',
    title: 'ICSE Internal Assessment Marking Criteria',
    content: `ICSE Internal Assessment (20 marks per subject) — typically split as:
- Practical/File work: 10 marks — assessed on accuracy, neatness, completeness, originality.
- Project work: 10 marks — assessed on originality (3), content (4), presentation (2), viva (1).
Project must be handwritten in student's own words. Plagiarism = deduction of marks or disqualification.
Viva-voce tests understanding: student must explain aim, methodology, results of own project.`,
    tags: 'internal-assessment,rubric,marks', source: 'manual'
  },
  {
    subject: 'General', className: '10', category: 'glossary', chapter: 'All',
    title: 'ICSE Board Examination Terminology',
    content: `ICSE: Indian Certificate of Secondary Education — Class 10 exam conducted by CISCE (Council for the Indian School Certificate Examinations), established 1958.
Internal Assessment: school-based evaluation (20% weight) including practical work, projects, portfolios.
External Examination: board-conducted theory paper (80% weight for most subjects).
Specimen Paper: official CISCE sample paper showing paper pattern for current year.
Marking Scheme: official answer key showing how marks are awarded stepwise.
Compartment Exam: second chance exam for students who fail one or two subjects.
Pass criteria: 33% in each subject (external + internal combined).`,
    tags: 'icse,cisce,terminology,board', source: 'manual'
  },
  {
    subject: 'General', className: '10', category: 'project_exemplar', chapter: 'General',
    title: 'Universal ICSE Project Quality Standards',
    content: `A high-scoring ICSE project must:
1. Be in student's own handwriting, on A4 sheets bound or in a file.
2. Have a clear, focused AIM — one specific question being investigated.
3. Demonstrate understanding of underlying concepts in the INTRODUCTION/THEORY section.
4. Use primary data (experiments, surveys, observations) where possible, not just secondary research.
5. Present OBSERVATIONS in well-labeled tables with correct units and significant figures.
6. Have labeled DIAGRAMS / PHOTOGRAPHS / MAPS — pencil sketches, ink labels.
7. State RESULTS clearly, then compare with expected/theoretical values.
8. List PRECAUTIONS taken and SOURCES OF ERROR.
9. End with a CONCLUSION answering the original aim.
10. Include BIBLIOGRAPHY listing all sources (textbooks + URLs with access date).
11. Show ORIGINALITY — student voice, not copied text. Avoid plagiarism.
12. Be 12-20 pages for most subjects.`,
    tags: 'project,quality,standards,originality', source: 'manual'
  },
  {
    subject: 'General', className: '10', category: 'rubric', chapter: 'Writing',
    title: 'ICSE Writing Style Guidelines',
    content: `ICSE examiner expectations for written answers:
- Use simple, clear, formal English — no slang or text-speak.
- Define terms before using them.
- Use bullet points for lists, paragraphs for prose.
- Show working in numerical answers (stepwise marks awarded).
- Underline key terms.
- For diagrams: pencil for drawing, pen for labels, neat lines, title and axis labels.
- For equations: balanced, with state symbols in chemistry.
- In essays: introduction, body paragraphs (each with topic sentence + evidence), conclusion.
- Avoid long quotes — paraphrase and cite.`,
    tags: 'writing,style,examiner', source: 'manual'
  }
];

// Helper: get all unique subjects in the knowledge base
export function getSubjects(): string[] {
  return Array.from(new Set(ICSE_SEED.map(c => c.subject)));
}

// Helper: get all unique categories for a subject
export function getCategories(subject?: string): string[] {
  const filtered = subject ? ICSE_SEED.filter(c => c.subject === subject) : ICSE_SEED;
  return Array.from(new Set(filtered.map(c => c.category)));
}
