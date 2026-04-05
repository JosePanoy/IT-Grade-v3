import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import "../css/grade-lookup.css";
import searching from "../gif/searching.gif";
import searching1 from "../gif/searching1.gif";
import searching2 from "../gif/searching2.gif";
import searching3 from "../gif/searching3.gif";
import searching4 from "../gif/searching4.gif";
import notFound1 from "../gif/not-found1.gif";
import notFound2 from "../gif/not-found2.gif";
import notFound3 from "../gif/not-found3.gif";
import congrats1 from "../gif/congrats1.gif";
import congrats2 from "../gif/congrats2.gif";
import congrats3 from "../gif/congrats3.gif";
import congrats4 from "../gif/congrats4.gif";
import almost1 from "../gif/allmost1.gif";
import almost2 from "../gif/allmost2.gif";
import almost3 from "../gif/allmost3.gif";
import almost4 from "../gif/allmost4.gif";
import failedGif from "../gif/failed.gif";
import { useGradeData } from "../../context/grade-data-context.jsx";
import backIcon from "../img/back.png";

const searchingGifs = [searching, searching1, searching2, searching3, searching4];
const notFoundGifs = [notFound1, notFound2, notFound3];
const congratsGifs = [congrats1, congrats2, congrats3, congrats4];
const almostGifs = [almost1, almost2, almost3, almost4];
const NOTE_MODAL_STORAGE_KEY = "itGrades:lookupNoteModalSeen:v1";
const SUBJECT_SECTION_OPTIONS = {
  ITCC112: [
    { value: "section1", label: "Section 1" },
    { value: "section2", label: "Section 2" },
    { value: "section4", label: "Section 4" },
    { value: "section5", label: "Section 5" },
  ],
  ITPD1: [
    { value: "section2", label: "Section 2" },
    { value: "section4", label: "Section 4" },
  ],
  ITCC121: [
    { value: "section4", label: "Section 4" },
    { value: "section5", label: "Section 5" },
  ],
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut", when: "beforeChildren", staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  exit: { opacity: 0, y: -18, transition: { duration: 0.3, ease: "easeIn" } },
};

const pickRandom = (collection) => collection[Math.floor(Math.random() * collection.length)];

// Robust text normalization for matching names and IDs
const stripDiacritics = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalizeName = (text) =>
  stripDiacritics(String(text ?? ""))
    .replace(/[`'’]/g, "") // remove apostrophes/backticks
    .replace(/\s+/g, " ") // collapse whitespace
    .trim()
    .toLowerCase();

const normalizeNameTight = (text) => normalizeName(text).replace(/\s+/g, "");

const normalizeId = (text) => String(text ?? "").trim();

const normalizeGrade = (grade) => {
  if (typeof grade === "number") {
    return grade;
  }
  if (typeof grade === "string") {
    const trimmed = grade.trim().toUpperCase();
    if (trimmed === "NC") {
      return "NC";
    }
    const numeric = parseFloat(trimmed);
    return Number.isNaN(numeric) ? null : numeric;
  }
  return null;
};

const evaluatePerformance = (grade) => {
  const normalized = normalizeGrade(grade);

  if (normalized === "NC" || normalized === 4 || normalized === 5) {
    return {
      tone: "failed",
      title: "Important reminder",
      message: "The results flag a failed standing. Please approach me if you have questions or need guidance.",
      gif: failedGif,
    };
  }

  if (typeof normalized === "number") {
    if (normalized >= 1 && normalized <= 2.5) {
      return {
        tone: "congrats",
        title: "Great effort!",
        message: "You delivered a strong performance. Keep this momentum as we move forward.",
        gif: pickRandom(congratsGifs),
      };
    }

    if (normalized >= 2.75 && normalized <= 3) {
      return {
        tone: "almost",
        title: "You made it.",
        message: "You passed, but you were close to the threshold. Let us keep working to strengthen your foundation.",
        gif: pickRandom(almostGifs),
      };
    }
  }

  return {
    tone: "neutral",
    title: "Result recorded",
    message: "Your final grade has been logged. Stay committed and aim higher every step of the way.",
    gif: pickRandom(congratsGifs),
  };
};

const formatGrade = (grade) => {
  if (typeof grade === "number") {
    const fixed = grade.toFixed(2);
    return fixed.endsWith("00") ? grade.toFixed(1) : fixed.replace(/0$/, "");
  }
  if (typeof grade === "string") {
    return grade.trim();
  }
  return String(grade ?? "");
};

function GradeLookup({ onBack = () => {} }) {
  const { subjectKey: rawSubjectKey } = useParams();
  const navigate = useNavigate();
  const subjectKey = (rawSubjectKey || "").toUpperCase();
  const sectionOptions = SUBJECT_SECTION_OPTIONS[subjectKey] ?? [];

  useEffect(() => {
    if (!Object.prototype.hasOwnProperty.call(SUBJECT_SECTION_OPTIONS, subjectKey)) {
      navigate("/lookup", { replace: true });
    }
  }, [subjectKey, navigate]);

  const { studentsBySubject } = useGradeData();
  const [selectedSection, setSelectedSection] = useState("");
  const gradeRecords = useMemo(() => {
    if (!selectedSection) {
      return [];
    }
    const subjectData = studentsBySubject?.[subjectKey] ?? {};
    const records = subjectData[selectedSection] ?? [];
    return records;
  }, [studentsBySubject, subjectKey, selectedSection]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [activeGif, setActiveGif] = useState(null);
  const [result, setResult] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem(NOTE_MODAL_STORAGE_KEY) === "1";
    if (!seen) {
      setShowNoteModal(true);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!showNoteModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showNoteModal]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (!selectedSection) {
      setError("Please choose your section first.");
      return;
    }

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError("Please enter your ID number or last name.");
      return;
    }

    setError("");
    setStatus("searching");
    setActiveGif(pickRandom(searchingGifs));
    setResult(null);
    setPerformance(null);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const qId = normalizeId(trimmedQuery);
      const qName = normalizeName(trimmedQuery);
      const qNameTight = normalizeNameTight(trimmedQuery);

      const exactId = gradeRecords.filter((r) => normalizeId(r.id) === qId);
      if (exactId.length === 1) {
        const match = exactId[0];
        setResult(match);
        const performanceResult = evaluatePerformance(match.finalsGrade);
        setPerformance(performanceResult);
        setActiveGif(performanceResult.gif);
        setStatus("success");
        return;
      }

      const exactName = gradeRecords.filter((r) => {
        const n = normalizeName(r.lastName);
        return n === qName || normalizeNameTight(r.lastName) === qNameTight;
      });
      if (exactName.length === 1) {
        const match = exactName[0];
        setResult(match);
        const performanceResult = evaluatePerformance(match.finalsGrade);
        setPerformance(performanceResult);
        setActiveGif(performanceResult.gif);
        setStatus("success");
        return;
      }

      // Fallback: tolerate partials if they uniquely identify a record
      const idPartials = qId.length >= 4 ? gradeRecords.filter((r) => normalizeId(r.id).includes(qId)) : [];
      if (idPartials.length === 1) {
        const match = idPartials[0];
        setResult(match);
        const performanceResult = evaluatePerformance(match.finalsGrade);
        setPerformance(performanceResult);
        setActiveGif(performanceResult.gif);
        setStatus("success");
        return;
      }

      const namePartials = gradeRecords.filter((r) => {
        const n = normalizeName(r.lastName);
        const t = normalizeNameTight(r.lastName);
        return n.includes(qName) || t.includes(qNameTight);
      });
      if (namePartials.length === 1) {
        const match = namePartials[0];
        setResult(match);
        const performanceResult = evaluatePerformance(match.finalsGrade);
        setPerformance(performanceResult);
        setActiveGif(performanceResult.gif);
        setStatus("success");
        return;
      }

      if ((exactId.length + exactName.length + idPartials.length + namePartials.length) > 1) {
        setStatus("not-found");
        setActiveGif(pickRandom(notFoundGifs));
        setError("Multiple close matches. Please use your full ID number.");
        return;
      }

      setStatus("not-found");
      setActiveGif(pickRandom(notFoundGifs));
    }, 6500);
  };

  const handleBack = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onBack();
  };

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    if (error) {
      setError("");
    }
  };
  const handleSectionChange = (event) => {
    setSelectedSection(event.target.value);
    setError("");
    setStatus("idle");
    setResult(null);
    setPerformance(null);
  };

  const closeNoteModal = () => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(NOTE_MODAL_STORAGE_KEY, "1");
      } catch (error) {
        // Continue even if storage is unavailable
      }
    }
    setShowNoteModal(false);
  };

  const renderStatus = () => {
    switch (status) {
      case "idle":
        return (
          <div className="gradeLookup_idle">
            <h2>Ready when you are.</h2>
            <p>Provide your ID number for the quickest match. You may also use your registered last name.</p>
          </div>
        );
      case "searching":
        return (
          <div className="gradeLookup_statusCard">
            <img src={activeGif} alt="Searching animation" className="gradeLookup_statusGif" />
            <h2>Retrieving your record...</h2>
            <p>One moment. We are loading your final grade summary.</p>
          </div>
        );
      case "success":
        return (
          <div className="gradeLookup_resultCard">
            <div className="gradeLookup_resultDetails">
              <h2>{performance?.title}</h2>
              <p>{performance?.message}</p>
              {result && (
                <dl className="gradeLookup_resultMeta">
                  <div>
                    <dt>ID Number</dt>
                    <dd>{result.id}</dd>
                  </div>
                  <div>
                    <dt>Last Name</dt>
                    <dd>{result.lastName}</dd>
                  </div>
                  <div>
                    <dt>Section</dt>
                    <dd>{result.section}</dd>
                  </div>
                  <div>
                    <dt>Final Grade</dt>
                    <dd>{formatGrade(result.finalsGrade)}</dd>
                  </div>
                </dl>
              )}
            </div>
            {activeGif && <img src={activeGif} alt="Performance animation" className="gradeLookup_resultGif" />}
          </div>
        );
      case "not-found":
        return (
          <div className="gradeLookup_statusCard">
            <img src={activeGif} alt="No record animation" className="gradeLookup_statusGif" />
            <h2>No match found.</h2>
            <p>
              Please verify your entry. Try your full ID number or confirm the spelling of your last name. If everything looks correct, your name or grade might not yet be recorded in the system, kindly contact me for assistance. It is also possible that your grade is not available yet.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Motion.div className="gradeLookup" initial="hidden" animate="visible" variants={containerVariants}>
      <Motion.header className="gradeLookup_header" variants={itemVariants}>
        <button type="button" className="gradeLookup_backButton" onClick={handleBack}>
          <img src={backIcon} alt="" aria-hidden="true" className="gradeLookup_backIcon" />
          <span>Homepage</span>
        </button>
        <div className="gradeLookup_intro">
          <h1>Final Grade Lookup</h1>
          <p>Check the consolidated final grade for the section you belong to. Keep your ID number within reach.</p>
        </div>
      </Motion.header>

      <Motion.form className="gradeLookup_form" onSubmit={handleSearch} variants={itemVariants}>
        <label htmlFor="gradeLookupSection" className="gradeLookup_label">
          Section
        </label>
        <select
          id="gradeLookupSection"
          name="gradeLookupSection"
          className="gradeLookup_select"
          value={selectedSection}
          onChange={handleSectionChange}
        >
          <option value="" disabled>
            Please choose your section
          </option>
          {sectionOptions.map((section) => (
            <option key={section.value} value={section.value}>
              {section.label}
            </option>
          ))}
        </select>
        {selectedSection && (
          <>
            <p className="gradeLookup_hint">Tip: Choose your section and use your ID for the quickest match.</p>
            <label htmlFor="gradeLookupQuery" className="gradeLookup_label">
              Student identifier
            </label>
            <div className="gradeLookup_inputRow">
              <input
                id="gradeLookupQuery"
                name="gradeLookupQuery"
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Enter your ID number or last name"
                autoComplete="off"
                className="gradeLookup_input"
              />
              <button type="submit" className="gradeLookup_submitButton" disabled={!selectedSection}>
                Search grades
              </button>
            </div>
            <p className="gradeLookup_hint">Tip: Use your ID number for the most accurate search.</p>
          </>
        )}
        {error && <p className="gradeLookup_error">{error}</p>}
      </Motion.form>

      <AnimatePresence mode="wait">
        <Motion.section
          key={status}
          className="gradeLookup_feedback"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {renderStatus()}
        </Motion.section>
      </AnimatePresence>

      <AnimatePresence>
        {showNoteModal && (
          <Motion.div
            className="gradeLookup_modalBackdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Motion.div
              className="gradeLookup_modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="gradeLookupNoteTitle"
              aria-describedby="gradeLookupNoteDesc"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <p className="gradeLookup_modalLabel">Temporary Note</p>
              <h2 id="gradeLookupNoteTitle">Before you check your grade</h2>
              <div id="gradeLookupNoteDesc" className="gradeLookup_modalBody">
                <p>This grade is your combined Midterm and Pre-Final score from quizzes, activities, and long exams.</p>
                <ul>
                  <li>If your grade is 3.0 or below, you do not need to take the Final Exam.</li>
                  <li>If your grade is 4.0, 5.0, or NC, you need to take the Final Exam.</li>
                </ul>
              </div>
              <button type="button" className="gradeLookup_modalButton" onClick={closeNoteModal}>
                I Understand
              </button>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  );
}

export default GradeLookup;
