import { Interactive3DModel, AIContentResponse } from "../types";

export const INTERACTIVE_MODELS: Interactive3DModel[] = [
  {
    id: "human-heart",
    name: "Human Heart",
    category: "Cardiology & Anatomy",
    description: "An interactive, high-fidelity mechanical structure of the human heart, demonstrating chambers, valves, and primary blood vessels.",
    parts: [
      {
        name: "Aorta",
        label: "Aorta",
        description: "The main artery of the body, distributing oxygenated blood to all circulatory limbs.",
        function: "Carries oxygenated blood away from the left ventricle to the body.",
        coord: { x: 0, y: -75, z: 15 },
        highlightColor: "#e11d48",
        relatedQuizQuestion: {
          question: "Which chamber of the heart pumps blood directly into the Aorta?",
          options: ["Right Atrium", "Right Ventricle", "Left Atrium", "Left Ventricle"],
          answer: 3,
          explanation: "The left ventricle contracts to pump oxygenated blood through the aortic valve directly into the aorta, distributing it throughout the body."
        }
      },
      {
        name: "Left Ventricle",
        label: "Left Ventricle",
        description: "The thickest of the heart's chambers, responsible for pumping oxygenated blood to the whole body.",
        function: "Receives blood from the left atrium and pumps it into the aorta under high pressure.",
        coord: { x: -30, y: 35, z: -20 },
        highlightColor: "#be123c",
        relatedQuizQuestion: {
          question: "Why does the Left Ventricle have much thicker muscular walls than the Right Ventricle?",
          options: [
            "It holds more volume of blood",
            "It must generate high pressure to pump blood to the entire body",
            "It filters toxins from oxygenated blood",
            "It is closer to the lungs"
          ],
          answer: 1,
          explanation: "The left ventricle needs thicker myocardium because it must generate enough force to pump blood throughout the systemic circulation of the entire body, whereas the right ventricle only pumps to the nearby lungs."
        }
      },
      {
        name: "Right Ventricle",
        label: "Right Ventricle",
        description: "The lower right chamber that receives deoxygenated blood and pumps it into the pulmonary artery.",
        function: "Pumps deoxygenated blood to the lungs for carbon dioxide removal and oxygen reloading.",
        coord: { x: 30, y: 30, z: 20 },
        highlightColor: "#2563eb",
        relatedQuizQuestion: {
          question: "Blood pumped out of the Right Ventricle goes directly to which organ?",
          options: ["The Brain", "The Liver", "The Lungs", "The Kidneys"],
          answer: 2,
          explanation: "The right ventricle pumps oxygen-depleted blood to the lungs via the pulmonary artery, where the blood drops off carbon dioxide and gains oxygen."
        }
      },
      {
        name: "Left Atrium",
        label: "Left Atrium",
        description: "The upper left chamber receiving freshly oxygenated blood returned from the lungs.",
        function: "Acts as a receiving vessel for pulmonary blood and transfers it to the left ventricle.",
        coord: { x: -45, y: -25, z: -10 },
        highlightColor: "#db2777",
        relatedQuizQuestion: {
          question: "Where does the oxygenated blood entering the Left Atrium come from?",
          options: ["The Lungs", "The Vena Cava", "The Left Ventricle", "The Coronary Sinus"],
          answer: 0,
          explanation: "Oxygenated blood travels back from the lungs through the four pulmonary veins and pools into the left atrium."
        }
      },
      {
        name: "Right Atrium",
        label: "Right Atrium",
        description: "The chamber that gathers oxygen-depleted systemic blood returning from the upper and lower limbs.",
        function: "Collects deoxygenated blood from the Vena Cava and passes it to the right ventricle.",
        coord: { x: 45, y: -20, z: 10 },
        highlightColor: "#1d4ed8",
        relatedQuizQuestion: {
          question: "Which major vessels carry deoxygenated blood directly into the Right Atrium?",
          options: ["Pulmonary Artery", "Aorta", "Vena Cava", "Pulmonary Veins"],
          answer: 2,
          explanation: "The Superior and Inferior Vena Cava collect returning deoxygenated blood from the body and empty it into the right atrium."
        }
      },
      {
        name: "Pulmonary Artery",
        label: "Pulmonary Artery",
        description: "The large blood vessel carrying oxygen-poor blood to the lungs.",
        function: "Transports blood from the right ventricle into both the left and right lungs.",
        coord: { x: 15, y: -45, z: 30 },
        highlightColor: "#0284c7"
      }
    ]
  },
  {
    id: "solar-system",
    name: "Solar System",
    category: "Astronomy & Astrophysics",
    description: "An interactive, interactive model of our solar system showcasing planetary orbits, speeds, scale, and specific physical compositions.",
    parts: [
      {
        name: "Sun",
        label: "Sun",
        description: "The magnificent, extremely hot star at the center of our solar system, supporting life on Earth.",
        function: "Provides gravitational attraction holding the system together and supplies solar warmth/light.",
        coord: { x: 0, y: 0, z: 0 },
        highlightColor: "#eab308",
        relatedQuizQuestion: {
          question: "What process powers the intense heat and light generated by the Sun?",
          options: ["Nuclear Fission", "Chemical Combustion", "Nuclear Fusion", "Radioactive Decay"],
          answer: 2,
          explanation: "Nuclear fusion, primarily fusing hydrogen into helium under immense pressure and gravity, generates the enormous energy emitted by the Sun."
        }
      },
      {
        name: "Mercury",
        label: "Mercury",
        description: "The closest planet to the Sun. Swift orbital speeds and intense thermal variance.",
        function: "Demonstrates high temperature extremes due to near-total lack of defensive atmosphere.",
        coord: { x: -28, y: -10, z: 5 },
        highlightColor: "#78716c"
      },
      {
        name: "Venus",
        label: "Venus",
        description: "Earth's sister size, buried beneath an ultra-dense carbon dioxide atmosphere causing runaway greenhouse heat.",
        function: "An extreme demonstration of atmospheric insulation and runaway greenhouse physics.",
        coord: { x: 38, y: 15, z: -10 },
        highlightColor: "#ea580c"
      },
      {
        name: "Earth",
        label: "Earth",
        description: "Our blue paradise. Liquid water, defensive magnetosphere, active tectonic cycles, and thriving life.",
        function: "The unique cradle of life maintaining temperature thresholds via carbon and water cycles.",
        coord: { x: -55, y: -25, z: 15 },
        highlightColor: "#059669",
        relatedQuizQuestion: {
          question: "What is the primary role of Earth's magnetic magnetosphere?",
          options: [
            "It pulls the Moon into locked rotation",
            "It shields life by deflecting harmful solar wind and cosmic rays",
            "It triggers standard oceanic tidal flows",
            "It holds the continental plates in lock"
          ],
          answer: 1,
          explanation: "Earth's magnetic field acts as a protective shield, deflecting solar winds filled with charged energetic particles that would otherwise strip away the atmosphere."
        }
      },
      {
        name: "Mars",
        label: "Mars",
        description: "The red rusty desert planet featuring iron oxide soil, frozen polar caps, and Olympus Mons.",
        function: "An arid, low-atmosphere celestial candidate representing the future frontiers of planetary geology.",
        coord: { x: 68, y: -45, z: -20 },
        highlightColor: "#dc2626"
      },
      {
        name: "Jupiter",
        label: "Jupiter",
        description: "The solar king of gas giants, with dozens of moons and the famous Great Red Spot storm.",
        function: "Exerts massive gravitational shields, often vacuuming incoming asteroids out of Earth paths.",
        coord: { x: -95, y: -60, z: 40 },
        highlightColor: "#ca8a04"
      }
    ]
  },
  {
    id: "volcano",
    name: "Volcano Cross-Section",
    category: "Geological Sciences",
    description: "A three-dimensional anatomical cutaway showing dynamic underground mantle heating, tectonic vents, and volcanic eruptive paths.",
    parts: [
      {
        name: "Magma Chamber",
        label: "Magma Chamber",
        description: "An immense subterranean reservoir of molten liquid rock that sits under highly intense crustal compression.",
        function: "Stores melting mantle rocks until critical fluid pressure fractures surrounding structural stone.",
        coord: { x: 0, y: 75, z: 0 },
        highlightColor: "#b91c1c",
        relatedQuizQuestion: {
          question: "What is the difference between Magma and Lava?",
          options: [
            "Magma has ash mixed in, while Lava does not",
            "Magma is underground molten rock, while Lava is molten rock that breached the surface",
            "Magma is cool, while Lava is hot",
            "Magma is chemical, while Lava is metallic"
          ],
          answer: 1,
          explanation: "Molten rock called magma is stored beneath the Earth's surface in the magma chamber; once it exits through vents onto the surface, it is known as lava."
        }
      },
      {
        name: "Conduit (Vent)",
        label: "Main Conduit",
        description: "The primary high-pressure pipe routing pressurizing magma upwards toward the exit vent.",
        function: "Channellizes expanding gas-rock mixtures rapidly straight to the crater opening.",
        coord: { x: -5, y: 15, z: -5 },
        highlightColor: "#f97316"
      },
      {
        name: "Crater",
        label: "Crater",
        description: "The bowl-shaped depression at the surface neck, formed during previous pressurized blasts.",
        function: "Acts as the physical eruptive ring and chimney venting pyroclastic debris and ash clouds.",
        coord: { x: -10, y: -50, z: 0 },
        highlightColor: "#ea580c",
        relatedQuizQuestion: {
          question: "A collapsed volcanic crater formed when a massive magma chamber empties is called a:",
          options: ["Fissure", "Caldera", "Dike", "Geyser"],
          answer: 1,
          explanation: "A caldera is a large circular depression formed when a volcano collapses inward after a massive, rapid discharge of its magma chamber."
        }
      },
      {
        name: "Ash Cloud",
        label: "Ash Cloud",
        description: "A billowing plume consisting of millions of microscopic glass shards, mineral particles, and dissolved gases.",
        function: "Blocks solar radiation and damages atmosphere, respiratory tissues, and electronics.",
        coord: { x: 25, y: -85, z: 20 },
        highlightColor: "#a8a29e"
      }
    ]
  },
  {
    id: "cell-structure",
    name: "Cell Structure",
    category: "Cellular Biology",
    description: "An organic eukaryotic cell showing fundamental internal membrane organelles and cellular processing structures.",
    parts: [
      {
        name: "Nucleus",
        label: "Nucleus",
        description: "The supreme command brain containing the cell's genetic blueprint sequence (DNA).",
        function: "Stores genomic DNA, regulates transcription, and controls all reproductive timing.",
        coord: { x: 0, y: -10, z: 5 },
        highlightColor: "#4f46e5",
        relatedQuizQuestion: {
          question: "Which structure inside the Nucleus serves as the assembly site for ribosomes?",
          options: ["Nucleoplasm", "Nuclear Envelope", "Nucleolus", "Chromatin"],
          answer: 2,
          explanation: "The nucleolus is a dense region within the nucleus dedicated to synthesis of ribosomal RNA and initial ribosomal subunit assembly."
        }
      },
      {
        name: "Mitochondria",
        label: "Mitochondria",
        description: "The famous power generators of the cell, running respiration and producing energy bonds.",
        function: "Runs oxidative phosphorylation to produce Adenosine Triphosphate (ATP) chemical fuel.",
        coord: { x: -55, y: 35, z: -20 },
        highlightColor: "#e11d48",
        relatedQuizQuestion: {
          question: "What specific form of chemical energy is produced by the Mitochondria during cellular respiration?",
          options: ["Glucose", "ATP", "Amino Acids", "NADH"],
          answer: 1,
          explanation: "Mitochondria convert nutrient chemical energy into ATP (Adenosine Triphosphate), the main functional energy currency used by other cellular operations."
        }
      },
      {
        name: "Ribosomes",
        label: "Ribosomes",
        description: "Tiny dense machines that assemble vital protein chains by translating genetic mRNA ribbons.",
        function: "Translates RNA sequences into custom polypeptide chains to build cell proteins.",
        coord: { x: 45, y: -30, z: 15 },
        highlightColor: "#10b981"
      },
      {
        name: "Cell Membrane",
        label: "Cell Membrane",
        description: "The double bilayer lipid boundary regulating passage of materials inside and out of the cell.",
        function: "Maintains homoeostatic internal conditions and governs selective intake.",
        coord: { x: 75, y: 45, z: -40 },
        highlightColor: "#059669"
      }
    ]
  },
  {
    id: "dna",
    name: "DNA Structure",
    category: "Molecular Genetics",
    description: "An interactive molecular double-helix strand displaying nitrogenous base pairings and the structural phosphate backbones.",
    parts: [
      {
        name: "Adenine & Thymine",
        label: "A-T Pairing",
        description: "A nitrogenous base pair bound by exactly two hydrogen bonds.",
        function: "Represents one-letter binary components encoding gene specifications within nucleotides.",
        coord: { x: 5, y: -35, z: -5 },
        highlightColor: "#ec4899",
        relatedQuizQuestion: {
          question: "How many hydrogen bonds connect an Adenine (A) base with a Thymine (T) base in DNA?",
          options: ["One bond", "Two bonds", "Three bonds", "Four bonds"],
          answer: 1,
          explanation: "Adenine binds exclusively with Thymine using exactly two hydrogen bonds, whereas Cytosine binds with Guanine using three hydrogen bonds."
        }
      },
      {
        name: "Cytosine & Guanine",
        label: "C-G Pairing",
        description: "A nitrogenous base pair bound by exactly three hydrogen bonds.",
        function: "Forms the high-stability links of the double helix key sequencer.",
        coord: { x: -5, y: 15, z: 5 },
        highlightColor: "#14b8a6",
        relatedQuizQuestion: {
          question: "Why is a DNA sequence with higher C-G (Cytosine-Guanine) content stronger and harder to separate than one with high A-T content?",
          options: [
            "C-G bonds are magnetic",
            "C-G base pairs are connected by three hydrogen bonds instead of two",
            "C-G bases have triple the molecular density",
            "They attract water molecule barriers"
          ],
          answer: 1,
          explanation: "Because Cytosine and Guanine are linked by three hydrogen bonds (compared to two in AT), sequences rich in CG require significantly higher temperatures to break apart (denature)."
        }
      },
      {
        name: "Phosphate Backbone",
        label: "Sugar-Phosphate Chain",
        description: "The spiral external struts of the helix, composed of alternating deoxyribose sugar and phosphate rings.",
        function: "Supports structural integrity and orients nucleotide directions correctly.",
        coord: { x: -45, y: -10, z: -35 },
        highlightColor: "#8b5cf6"
      }
    ]
  },
  {
    id: "brain",
    name: "Human Brain Mapping",
    category: "Neural Sciences",
    description: "A detailed functional neuroanatomy visualizer showing lobes, lobes, motor centers, and core brain sections.",
    parts: [
      {
        name: "Frontal Lobe",
        label: "Frontal Lobe",
        description: "The front cerebral cortex region governing logic, planning, executive control, and motor decisions.",
        function: "Directs goal-oriented reasoning, problem-solving, personality patterns, and active voluntary movement.",
        coord: { x: -50, y: -30, z: 25 },
        highlightColor: "#4f46e5",
        relatedQuizQuestion: {
          question: "Which of the following functions is primarily associated with the Frontal Lobe?",
          options: ["Visual processing", "Short-term logic, reasoning, and planning", "Understanding sound frequencies", "Postural balance"],
          answer: 1,
          explanation: "The frontal lobe is standardly known as the hub of executive functions, including decision making, logic, reasoning, personality expression, and planning."
        }
      },
      {
        name: "Occipital Lobe",
        label: "Occipital Lobe",
        description: "The posterior visual rendering center sitting at the absolute back of the cerebral hemisphere.",
        function: "Decodes visual inputs from optic nerves to form spatial recognition, shape, and colors.",
        coord: { x: 65, y: 10, z: -10 },
        highlightColor: "#be123c",
        relatedQuizQuestion: {
          question: "Damage to the Occipital Lobe would most immediately impair which functional feedback loop?",
          options: ["Hearing sounds", "Visual sight and imagery extraction", "Tactile temperature feels", "Scent memory patterns"],
          answer: 1,
          explanation: "The occipital lobe hosts the primary visual cortex, meaning injuries here disrupt eye feed processing, causing functional blindness or imagery distortion."
        }
      },
      {
        name: "Cerebellum",
        label: "Cerebellum",
        description: "The 'little brain' resting at the base of the skull, packing billions of coordination neurons.",
        function: "Coordinates precise voluntary muscle balances, fine motor skills, and procedural habit loops.",
        coord: { x: 45, y: 55, z: -25 },
        highlightColor: "#059669"
      },
      {
        name: "Brain Stem",
        label: "Brain Stem",
        description: "The primal motherboard connecting the cerebral hemispheres right into the spinal column.",
        function: "Drives critical biological life support systems like heart rate, heavy breathing, and sleep.",
        coord: { x: 10, y: 75, z: -5 },
        highlightColor: "#0891b2"
      }
    ]
  },
  {
    id: "electric-circuit",
    name: "Electric Circuit",
    category: "Electromagnetic Physics",
    description: "An interactive schematics board where charges flow from poles, showing resistors, bulbs, loops, and mechanical switches.",
    parts: [
      {
        name: "Battery (Cell)",
        label: "DC Power Source",
        description: "The chemical energy storage pumping positive/negative chemical current differentials.",
        function: "Supplies current electromotive force (voltage) across loop terminals.",
        coord: { x: 0, y: 65, z: 0 },
        highlightColor: "#dc2626",
        relatedQuizQuestion: {
          question: "What specific quantity represents the electromotive potential difference supplied by the Battery?",
          options: ["Resistance (Ohms)", "Current (Amperes)", "Voltage (Volts)", "Power (Watts)"],
          answer: 2,
          explanation: "Voltage (measured in Volts) is the electric potential difference from battery poles driving charged electrons along the circuit."
        }
      },
      {
        name: "Light Bulb",
        label: "Resistive Light Load",
        description: "A filament load converting electric force directly into hot radiant thermal and visual energy.",
        function: "Resists flow and acts as a electrical diagnostic visual indicator of loop conductivity.",
        coord: { x: -65, y: -25, z: 10 },
        highlightColor: "#eab308",
        relatedQuizQuestion: {
          question: "When a switch breaks the active loop, why does a bulb instantly go out?",
          options: [
            "Electrons evaporize immediately",
            "The circuit is open, blocking any flow of current",
            "Gravity draws current to the battery source",
            "The bulb gets cold immediately"
          ],
          answer: 1,
          explanation: "Electric current requires a fully continuous closed pathway. Opening a switch splits the circuit loop, stopping current instantaneously."
        }
      },
      {
        name: "Switch",
        label: "Toggle Switch",
        description: "A mechanical gate breaking or closing conductor contact.",
        function: "Opens or closes loop current pathway to control electrical application state.",
        coord: { x: 65, y: -25, z: -10 },
        highlightColor: "#2563eb"
      }
    ]
  }
];

export function getModelById(id: string): Interactive3DModel | undefined {
  return INTERACTIVE_MODELS.find(m => m.id === id || m.id === id.toLowerCase().trim().replace(/\s+/g, '-'));
}

export function getDefaultModelContent(id: string): AIContentResponse {
  const normalizedId = id.toLowerCase().trim().replace(/\s+/g, '-');
  
  switch (normalizedId) {
    case "human-heart":
      return {
        topic: "Human Heart Cardiology",
        detectedSuccessfully: true,
        modelSuggestions: ["human-heart"],
        summary: "An ultra-premium muscle pump that drives the dual systemic and pulmonary circulatory loops of the body.",
        detailedExplanation: "The human heart is an elegant, four-chambered muscle pump driving the systemic and pulmonary circulatory networks. The right side collects deoxygenated venous return from the Vena Cava and sends it to the lungs for oxygen enrichment. The left side pools this high-oxygen blood from the pulmonary veins and launches it at high pressure through the Aorta to oxygenate tissues. Muscular wall thickness varies significantly by function: the Left Ventricle has exceptionally thick myocardium to overcome high arterial resistance.",
        keyPoints: [
          "Left Ventricle features thick walls to pump high-pressure oxygenated blood safely to far limbs.",
          "Check valves operate passively matching mechanical fluid pressures to halt backing flows.",
          "Aorta has elastic properties assisting in continuous steady arterial perfusion."
        ],
        suggestedQuizzes: [
          {
            question: "Which blood vessel receives high-pressure oxygenated blood from the Left Ventricle?",
            options: ["Vena Cava", "Aorta", "Pulmonary Artery", "Coronary Vein"],
            correctAnswerIndex: 1,
            explanation: "The left ventricle pumps arterial oxygen-rich blood directly into the Aorta, the largest artery in systemic circulation."
          },
          {
            question: "What separates heart chambers to guarantee one-way circulation?",
            options: ["Lymph Nodes", "Myocardium Fibers", "Heart Valves", "Septal Capillaries"],
            correctAnswerIndex: 2,
            explanation: "Heart valves act as passive one-way mechanical gates that prevent blood from moving backward."
          }
        ]
      };
    case "solar-system":
      return {
        topic: "Astronomy & Gravity Mechanics",
        detectedSuccessfully: true,
        modelSuggestions: ["solar-system"],
        summary: "Our energetic home stellar system, with concentric gravitational orbits bound to our dominant G-type Sun.",
        detailedExplanation: "Our solar system is structured around the Sun, which hosts 99.8% of the system's mass. Inner planets like Earth and Mars have rocky compositions, while outer planets like Jupiter and Saturn are massive fluid gas giants. Orbits are stable ellipses controlled by Keplerian gravity potentials: planets closer to the gravity well experience extreme thermal fluctuations and revolve at high orbital speeds.",
        keyPoints: [
          "Solar energy is continuously manufactured by deep nuclear fusion of hydrogen into helium.",
          "Rocky inner planets stand in contrast with the low-density outer gas giants.",
          "Orbital velocity is strictly inversely related to the square root of the distance from the Sun."
        ],
        suggestedQuizzes: [
          {
            question: "Which planet has the dense greenhouse atmosphere causing runaway hot surface states?",
            options: ["Mercury", "Venus", "Mars", "Saturn"],
            correctAnswerIndex: 1,
            explanation: "Venus is surrounded by high-density carbon dioxide that traps infra-red heat, creating the hottest planetary surfaces in the system."
          }
        ]
      };
    case "volcano":
      return {
        topic: "Geological Sciences & Volcanology",
        detectedSuccessfully: true,
        modelSuggestions: ["volcano"],
        summary: "A geologic pipe letting thermal mantle heat and expanding high-pressure magma gases construct surface craters.",
        detailedExplanation: "Volcanoes are crucial geologic vents letting internal mantle energy reach the cooler surface boundary. Magma under extreme confinement builds fluid pressure in underground chambers. When stress cracks overlying rocks, magma ascends fast through main conduits, erupting as molten surface lava, rising ash clouds of pulverized glass and dissolved gaseous compounds.",
        keyPoints: [
          "Magma resides below ground, becoming classified as lava of varying density once it erupts to the surface.",
          "Ash clouds consisting of hot pulverized ash, minerals, and glass shards are highly hazardous to aircraft engines.",
          "Rapid caldera formation occurs when the roof of an empty magma chamber collapses."
        ],
        suggestedQuizzes: [
          {
            question: "What is magma called once it breaches the earth's surface?",
            options: ["Sediment", "Basalt", "Lava", "Mantle"],
            correctAnswerIndex: 2,
            explanation: "Molten rock below the surface is magma; once it breaches the surface through vents, it is officially classified as lava."
          }
        ]
      };
    case "cell-structure":
      return {
        topic: "Cellular Biology & Eukaryotes",
        detectedSuccessfully: true,
        modelSuggestions: ["cell-structure"],
        summary: "An organic eukaryotic machine with membrane-enclosed organelles operating in delicate homeostatic equilibrium.",
        detailedExplanation: "The eukaryotic cell is the fundamental module of complex biological organisms. Encompassed by a selective double lipo-protein membrane, the cell houses specific compartments or organelles. The central Nucleus stores hereditary sequences (DNA) and manages transcription; the Mitochondria generates ATP currency through cellular respiration; and Ribosomes string incoming RNA codes into proteins.",
        keyPoints: [
          "The Mitochondria has its own circular DNA, supporting the theory of endosimbiotic origin.",
          "Selective permeability in cell membranes controls incoming nutrient streams.",
          "Ribosomes form high-density protein factory nodes inside the cytoplasm."
        ],
        suggestedQuizzes: [
          {
            question: "Which organelle is universally dubbed the powerhouse of the cell?",
            options: ["Endoplasmic Reticulum", "Mitochondria", "Nucleolus", "Lysosome"],
            correctAnswerIndex: 1,
            explanation: "Mitochondria run oxidative phosphorylation to yield massive quantities of chemical ATP fuel."
          }
        ]
      };
    case "dna":
      return {
        topic: "Molecular Genetics & Double Helix",
        detectedSuccessfully: true,
        modelSuggestions: ["dna"],
        summary: "A double-stranded complementary informational polymer encoding blueprints of life processes through nucleotide codes.",
        detailedExplanation: "Deoxyribonucleic Acid (DNA) is a double-stranded helix storing structural recipes. Each turn of the helix consists of complementary nitrogenous bases paired together by hydrogen bonds (Adenine with Thymine; Cytosine with Guanine). This stable spiral ladder is held aligned by alternating sugar-phosphate backbones, maintaining correct key code orientation for copying.",
        keyPoints: [
          "Adenine pairs with Thymine (2 bonds) while Cytosine pairs with Guanine (3 bonds), making CG pairs more stable.",
          "Double strands are antiparallel: one strand goes 5' to 3' while the other runs 3' to 5'.",
          "Backbones consist of alternating deoxyribose sugar and phosphate rings with high tensile durability."
        ],
        suggestedQuizzes: [
          {
            question: "How many hydrogen bonds connect an Adenine (A) base with a Thymine (T) base?",
            options: ["One bond", "Two bonds", "Three bonds", "Four bonds"],
            correctAnswerIndex: 1,
            explanation: "A-T pairs have exactly two hydrogen bonds, making them easier to separate during transcriptions compared to three-bonded C-G pairs."
          }
        ]
      };
    case "brain":
      return {
        topic: "Human Neuroanatomy & Cerebral Mapping",
        detectedSuccessfully: true,
        modelSuggestions: ["brain"],
        summary: "The supreme electrochemical computer directing logic, voluntary motor coordination, and vital physiological life-support.",
        detailedExplanation: "The human brain is divided into hemispheres and specialized functional regions or lobes. The Frontal Lobe manages executive logic, long-term planning, and voluntary motor patterns. The posterior Occipital Lobe is a high-speed optic interpreter decoding inputs from the optic nerves. Underneath, the Cerebellum handles posture balance, fine motor activities, and procedural reflexes.",
        keyPoints: [
          "Frontal Lobe governs logical planning and decision loops, being the latest to reach maturity in adults.",
          "Occipital Lobe interprets input signals from retinas to establish perspective, shape, and colors.",
          "Primal biological loops (breathing, cardiac cycles) are managed continuously by the Brain Stem."
        ],
        suggestedQuizzes: [
          {
            question: "Which lobe of the brain is the principal hub for planning, decision-making, and executive function?",
            options: ["Occipital Lobe", "Frontal Lobe", "Temporal Lobe", "Parietal Lobe"],
            correctAnswerIndex: 1,
            explanation: "The frontal lobe houses primary executive circuits handling goal-directed logic and personality styles."
          }
        ]
      };
    case "electric-circuit":
      return {
        topic: "Electric Circuit & DC Loops",
        detectedSuccessfully: true,
        modelSuggestions: ["electric-circuit"],
        summary: "A continuous closed loop letting electricity flow down a voltage potential to trigger resistive loads or switch controls.",
        detailedExplanation: "Electric circuits require a continuous closed conductive pathway for electric charges to flow. A battery provides the electromotive voltage difference driving negatively charged electrons. When the mechanical switch is closed, current circles the path, lighting up resistive loads like bulbs and transferring electrical energy into light and thermal output.",
        keyPoints: [
          "Voltage acts as the pressure pushing charges; current is the rate of flow; and resistance restricts it.",
          "Electrons move from the negative terminal to positive terminal, opposite to conventional current flows.",
          "A broken or open switch interrupts the entire pathway, instantly bringing flow rates to zero."
        ],
        suggestedQuizzes: [
          {
            question: "What unit of measurement represents the rate of electrical charge flow (current)?",
            options: ["Volts", "Ohms", "Amperes", "Watts"],
            correctAnswerIndex: 2,
            explanation: "Amperes (Amps) measure the volume of electric charges passing a given cross-section per second."
          }
        ]
      };
    default:
      return {
        topic: "General Learning Concept",
        detectedSuccessfully: true,
        modelSuggestions: [id],
        summary: `Select an interactive visual model from the library to explore fully synchronized 3D graphics, study sheets, and custom quizzes.`,
        detailedExplanation: "Click on any interactive models to load comprehensive 3D visual models and synchronized study sheets.",
        keyPoints: ["Detailed anatomical reviews auto-align dynamically.", "Integrated quizzes verify structural insights."],
        suggestedQuizzes: []
      };
  }
}

export function detectModelSuggestion(text: string): string[] {
  const norm = text.toLowerCase();
  const suggestions: string[] = [];
  
  if (norm.includes("heart") || norm.includes("ventricle") || norm.includes("atrium") || norm.includes("aorta") || norm.includes("cardiac") || norm.includes("blood flow")) {
    suggestions.push("human-heart");
  }
  if (norm.includes("solar") || norm.includes("planet") || norm.includes("sun") || norm.includes("jupiter") || norm.includes("earth") || norm.includes("orbit")) {
    suggestions.push("solar-system");
  }
  if (norm.includes("volcano") || norm.includes("magma") || norm.includes("lava") || norm.includes("crater") || norm.includes("eruption")) {
    suggestions.push("volcano");
  }
  if (norm.includes("cell") || norm.includes("membrane") || norm.includes("mitochondria") || norm.includes("nucleus") || norm.includes("organelle")) {
    suggestions.push("cell-structure");
  }
  if (norm.includes("dna") || norm.includes("helix") || norm.includes("gene") || norm.includes("nucleotide") || norm.includes("chromosome")) {
    suggestions.push("dna");
  }
  if (norm.includes("brain") || norm.includes("lobe") || norm.includes("cerebellum") || norm.includes("neurology") || norm.includes("neural")) {
    suggestions.push("brain");
  }
  if (norm.includes("circuit") || norm.includes("battery") || norm.includes("switch") || norm.includes("resistor") || norm.includes("electricity") || norm.includes("voltage")) {
    suggestions.push("electric-circuit");
  }

  // If nothing matched directly, provide a couple of logical default recommendations for textbook exploration (e.g., heart & solar-system)
  if (suggestions.length === 0) {
    suggestions.push("human-heart", "solar-system");
  }
  
  return suggestions;
}
