import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import section2 from "../../grades/section2.json";
import section4 from "../../grades/section4.json";
import section5 from "../../grades/section5.json";

const STORAGE_KEY = "itGrades:students";

const GradeDataContext = createContext(null);

const clone = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const SECTION_MAP = {
  section2: { label: "Section 2", records: section2 },
  section4: { label: "Section 4", records: section4 },
  section5: { label: "Section 5", records: section5 },
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
  const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch (error) {
      console.warn("[GradeData] Failed to parse stored data. Falling back to defaults.", error);
    }
  }

  return Object.entries(SECTION_MAP).reduce((accumulator, [key, value]) => {
    accumulator[key] = formatRecords(value.records, key);
    return accumulator;
  }, {});
}

export function GradeDataProvider({ children }) {
  const [studentsBySection, setStudentsBySection] = useState(loadInitialData);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(studentsBySection));
  }, [studentsBySection]);

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
    setStudentsBySection((previous) => {
      const next = clone(previous);
      const section = next[sectionKey] ?? [];

      section.push({
        id: String(student.id).trim(),
        lastName: String(student.lastName).trim(),
        finalsGrade: student.finalsGrade,
        section: sectionKey.replace("section", ""),
      });

      next[sectionKey] = section;
      return next;
    });
  };

  const updateStudent = (sectionKey, studentId, updates) => {
    setStudentsBySection((previous) => {
      const next = clone(previous);
      const section = next[sectionKey] ?? [];

      next[sectionKey] = section.map((entry) =>
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
    setStudentsBySection((previous) => {
      const next = clone(previous);
      const section = next[sectionKey] ?? [];
      next[sectionKey] = section.filter((entry) => entry.id !== studentId);
      return next;
    });
  };

  const resetToDefaults = () => {
    setStudentsBySection(loadInitialData());
  };

  const value = useMemo(
    () => ({
      studentsBySection,
      allStudents,
      addStudent,
      updateStudent,
      deleteStudent,
      resetToDefaults,
    }),
    [studentsBySection, allStudents],
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
