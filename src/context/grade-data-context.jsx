import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import section1 from "../../grades/ITCC112/section1.json";
import section2 from "../../grades/ITCC112/section2.json";
import section4 from "../../grades/ITCC112/section4.json";
import section5 from "../../grades/ITCC112/section5.json";
import itpd1Section2 from "../../grades/ITPD1/section2.json";
import itpd1Section4 from "../../grades/ITPD1/section4.json";

const STORAGE_KEY = "itGrades:studentsBySubject";
const LEGACY_STORAGE_KEY = "itGrades:students";

const GradeDataContext = createContext(null);

const clone = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const SUBJECT_SECTION_MAP = {
  ITCC112: {
    section1: { label: "Section 1", records: section1 },
    section2: { label: "Section 2", records: section2 },
    section4: { label: "Section 4", records: section4 },
    section5: { label: "Section 5", records: section5 },
  },
  ITPD1: {
    section2: { label: "Section 2", records: itpd1Section2 },
    section4: { label: "Section 4", records: itpd1Section4 },
  },
};

function formatRecords(records = [], sectionKey) {
  return records.map((record) => ({
    id: String(record.id ?? "").trim(),
    lastName: String(record.lastName ?? "").trim(),
    finalsGrade: typeof record.finalsGrade === "number" ? record.finalsGrade : String(record.finalsGrade ?? "").trim(),
    section: sectionKey.replace("section", ""),
  }));
}

function loadInitialData() {
  const get = (key) => (typeof window !== "undefined" ? window.localStorage.getItem(key) : null);

  const storedNew = get(STORAGE_KEY);
  if (storedNew) {
    try {
      const parsed = JSON.parse(storedNew);
      if (parsed && typeof parsed === "object") {
        // Ensure any newly added sections (e.g., section1) are present
        const merged = clone(parsed);
        for (const [subjectKey, sections] of Object.entries(SUBJECT_SECTION_MAP)) {
          merged[subjectKey] = merged[subjectKey] ?? {};
          for (const [sectionKey, value] of Object.entries(sections)) {
            if (!Array.isArray(merged[subjectKey][sectionKey])) {
              merged[subjectKey][sectionKey] = formatRecords(value.records, sectionKey);
            }
          }
        }
        return merged;
      }
    } catch (error) {
      console.warn("[GradeData] Failed to parse stored subject data. Falling back to migration/defaults.", error);
    }
  }

  const storedLegacy = get(LEGACY_STORAGE_KEY);
  if (storedLegacy) {
    try {
      const parsedLegacy = JSON.parse(storedLegacy);
      if (parsedLegacy && typeof parsedLegacy === "object") {
        const itcc112 = parsedLegacy;
        const itpd1 = Object.entries(SUBJECT_SECTION_MAP.ITPD1).reduce((acc, [sectionKey, value]) => {
          acc[sectionKey] = formatRecords(value.records, sectionKey);
          return acc;
        }, {});
        return { ITCC112: itcc112, ITPD1: itpd1 };
      }
    } catch (error) {
      console.warn("[GradeData] Failed to parse legacy data. Falling back to defaults.", error);
    }
  }

  return Object.entries(SUBJECT_SECTION_MAP).reduce((subjectAcc, [subjectKey, sections]) => {
    subjectAcc[subjectKey] = Object.entries(sections).reduce((acc, [sectionKey, value]) => {
      acc[sectionKey] = formatRecords(value.records, sectionKey);
      return acc;
    }, {});
    return subjectAcc;
  }, {});
}

export function GradeDataProvider({ children }) {
  const [studentsBySubject, setStudentsBySubject] = useState(loadInitialData);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(studentsBySubject));
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (error) {
      // Keep app functional even if storage fails
      console.warn("[GradeData] Failed to persist subject data to localStorage.", error);
    }
  }, [studentsBySubject]);

  const studentsBySection = useMemo(() => studentsBySubject.ITCC112 ?? {}, [studentsBySubject]);

  const allStudents = useMemo(() => {
    return Object.values(studentsBySection)
      .flat()
      .map((entry) => ({
        ...entry,
        finalsGrade:
          typeof entry.finalsGrade === "number"
            ? entry.finalsGrade
            : Number.isNaN(Number(entry.finalsGrade))
            ? entry.finalsGrade
            : Number.parseFloat(entry.finalsGrade),
      }));
  }, [studentsBySection]);

  const addStudent = (sectionKey, student) => {
    setStudentsBySubject((previous) => {
      const next = clone(previous);
      next.ITCC112 = next.ITCC112 ?? { section1: [], section2: [], section4: [], section5: [] };
      const section = next.ITCC112[sectionKey] ?? [];
      section.push({
        id: String(student.id).trim(),
        lastName: String(student.lastName).trim(),
        finalsGrade: student.finalsGrade,
        section: sectionKey.replace("section", ""),
      });
      next.ITCC112[sectionKey] = section;
      return next;
    });
  };

  const updateStudent = (sectionKey, studentId, updates) => {
    setStudentsBySubject((previous) => {
      const next = clone(previous);
      const section = (next.ITCC112?.[sectionKey] ?? []);
      next.ITCC112 = next.ITCC112 ?? { section1: [], section2: [], section4: [], section5: [] };
      next.ITCC112[sectionKey] = section.map((entry) =>
        entry.id === studentId
          ? {
              ...entry,
              ...updates,
              id: String(updates.id ?? entry.id).trim(),
              lastName: String(updates.lastName ?? entry.lastName).trim(),
              finalsGrade: updates.finalsGrade ?? entry.finalsGrade,
              section: sectionKey.replace("section", ""),
            }
          : entry,
      );
      return next;
    });
  };

  const deleteStudent = (sectionKey, studentId) => {
    setStudentsBySubject((previous) => {
      const next = clone(previous);
      const section = next.ITCC112?.[sectionKey] ?? [];
      if (!next.ITCC112) next.ITCC112 = { section1: [], section2: [], section4: [], section5: [] };
      next.ITCC112[sectionKey] = section.filter((entry) => entry.id !== studentId);
      return next;
    });
  };

  const resetToDefaults = () => {
    setStudentsBySubject(loadInitialData());
  };

  const value = useMemo(
    () => ({
      studentsBySection,
      studentsBySubject,
      allStudents,
      addStudent,
      updateStudent,
      deleteStudent,
      resetToDefaults,
    }),
    [studentsBySection, studentsBySubject, allStudents],
  );

  return <GradeDataContext.Provider value={value}>{children}</GradeDataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGradeData() {
  const context = useContext(GradeDataContext);
  if (!context) {
    throw new Error("useGradeData must be used within a GradeDataProvider.");
  }
  return context;
}
