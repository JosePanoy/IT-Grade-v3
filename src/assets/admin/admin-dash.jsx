import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/admin.css";
import { useGradeData } from "../../context/grade-data-context.jsx";
import { SUPER_ADMIN_CODE, clearSuperAdminSession, hasSuperAdminSession } from "./auth-utils.js";

const SECTION_OPTIONS = [
  { key: "section2", label: "Section 2" },
  { key: "section4", label: "Section 4" },
  { key: "section5", label: "Section 5" },
];

const initialFormState = {
  id: "",
  lastName: "",
  finalsGrade: "",
  sectionKey: SECTION_OPTIONS[0].key,
};

const ConfirmationModal = ({ isOpen, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="adminModal_backdrop" role="dialog" aria-modal="true">
      <div className="adminModal_card">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="adminModal_actions">
          <button type="button" className="adminSecondaryButton" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="adminPrimaryButton" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const FormDialog = ({
  isOpen,
  mode,
  formState,
  formErrors,
  onClose,
  onChange,
  onSubmit,
}) => {
  if (!isOpen) {
    return null;
  }

  const title = mode === "add" ? "Add student record" : "Edit student record";

  return (
    <div className="adminModal_backdrop" role="dialog" aria-modal="true">
      <form className="adminModal_card adminModal_card--form" onSubmit={onSubmit}>
        <h2>{title}</h2>
        <div className="adminForm_row">
          <label htmlFor="studentId" className="adminLabel">
            Student ID
          </label>
          <input
            id="studentId"
            name="id"
            className="adminInput"
            value={formState.id}
            onChange={onChange}
            placeholder="e.g. 63074"
            maxLength={12}
            required
          />
          {formErrors.id && <span className="adminError">{formErrors.id}</span>}
        </div>
        <div className="adminForm_row">
          <label htmlFor="studentLastName" className="adminLabel">
            Last name
          </label>
          <input
            id="studentLastName"
            name="lastName"
            className="adminInput"
            value={formState.lastName}
            onChange={onChange}
            placeholder="Student family name"
            maxLength={32}
            required
          />
          {formErrors.lastName && <span className="adminError">{formErrors.lastName}</span>}
        </div>
        <div className="adminForm_row">
          <label htmlFor="studentFinalGrade" className="adminLabel">
            Final grade
          </label>
          <input
            id="studentFinalGrade"
            name="finalsGrade"
            className="adminInput"
            value={formState.finalsGrade}
            onChange={onChange}
            placeholder="Numeric (e.g. 2.5) or NC"
            maxLength={8}
            required
          />
          {formErrors.finalsGrade && <span className="adminError">{formErrors.finalsGrade}</span>}
        </div>
        <div className="adminForm_row">
          <label htmlFor="studentSection" className="adminLabel">
            Section
          </label>
          <select
            id="studentSection"
            name="sectionKey"
            className="adminInput"
            value={formState.sectionKey}
            onChange={onChange}
          >
            {SECTION_OPTIONS.map((section) => (
              <option key={section.key} value={section.key}>
                {section.label}
              </option>
            ))}
          </select>
        </div>
        <div className="adminModal_actions">
          <button type="button" className="adminSecondaryButton" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="adminPrimaryButton">
            {mode === "add" ? "Review add" : "Review changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

const Toast = ({ message, onDismiss }) => {
  if (!message) {
    return null;
  }

  return (
    <div className="adminToast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification">
        ×
      </button>
    </div>
  );
};

function normalizeGradeInput(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }

  const numeric = Number.parseFloat(trimmed);
  if (!Number.isNaN(numeric)) {
    return Number(numeric.toFixed(2));
  }

  return trimmed.toUpperCase();
}

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { studentsBySection, addStudent, updateStudent, deleteStudent } = useGradeData();

  const [selectedSection, setSelectedSection] = useState(SECTION_OPTIONS[0].key);
  const [dialogMode, setDialogMode] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [confirmState, setConfirmState] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const selectedStudents = useMemo(() => studentsBySection[selectedSection] ?? [], [studentsBySection, selectedSection]);

  useEffect(() => {
    if (!hasSuperAdminSession()) {
      navigate("/itgrade-v3", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (dialogMode === "add") {
      setFormState((previous) => ({
        ...initialFormState,
        sectionKey: selectedSection,
        id: dialogMode === "add" ? "" : previous.id,
      }));
    }
  }, [dialogMode, selectedSection]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => {
      setToastMessage("");
    }, 3200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const closeDialog = () => {
    setDialogMode(null);
    setFormState((current) => ({
      ...current,
      id: "",
      lastName: "",
      finalsGrade: "",
      sectionKey: selectedSection,
    }));
    setFormErrors({});
  };

  const openAddDialog = () => {
    setFormState({
      ...initialFormState,
      sectionKey: selectedSection,
    });
    setDialogMode("add");
    setFormErrors({});
  };

  const openEditDialog = (student, sectionKey) => {
    setFormState({
      id: student.id,
      lastName: student.lastName,
      finalsGrade: String(student.finalsGrade),
      sectionKey,
      originalId: student.id,
      originalSectionKey: sectionKey,
    });
    setDialogMode("edit");
    setFormErrors({});
  };

  const validateForm = (draft) => {
    const errors = {};
    if (!draft.id.trim()) {
      errors.id = "ID is required.";
    } else if (!/^\d{4,}$/.test(draft.id.trim())) {
      errors.id = "Use numeric ID with at least 4 digits.";
    }

    if (!draft.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }

    if (!draft.finalsGrade.trim()) {
      errors.finalsGrade = "Final grade is required.";
    } else {
      const normalized = normalizeGradeInput(draft.finalsGrade);
      if (typeof normalized === "number") {
        if (normalized < 1 || normalized > 5) {
          errors.finalsGrade = "Numeric grades must fall between 1.00 and 5.00.";
        }
      } else if (normalized !== "NC") {
        errors.finalsGrade = "Use a numeric grade or NC.";
      }
    }

    const targetSection = draft.sectionKey;
    const existingRecords = studentsBySection[targetSection] ?? [];
    const duplicate = existingRecords.some(
      (entry) => entry.id === draft.id.trim() && entry.id !== draft.originalId,
    );

    if (duplicate) {
      errors.id = "A student with this ID already exists in the chosen section.";
    }

    return errors;
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value,
    }));
    if (formErrors[name]) {
      setFormErrors((current) => ({
        ...current,
        [name]: "",
      }));
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const errors = validateForm(formState);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const normalizedGrade = normalizeGradeInput(formState.finalsGrade);
    const payload = {
      id: formState.id.trim(),
      lastName: formState.lastName.trim().toUpperCase(),
      finalsGrade: normalizedGrade,
    };

    setConfirmState({
      type: dialogMode,
      title: dialogMode === "add" ? "Confirm add student" : "Confirm update",
      message:
        dialogMode === "add"
          ? `Add ${payload.lastName} (${payload.id}) to ${getSectionLabel(formState.sectionKey)}?`
          : `Apply changes to ${payload.lastName} (${payload.id})?`,
      payload: {
        data: payload,
        targetSection: formState.sectionKey,
        originalId: formState.originalId ?? formState.id,
        originalSectionKey: formState.originalSectionKey ?? formState.sectionKey,
      },
    });
  };

  const handleDelete = (sectionKey, student) => {
    setConfirmState({
      type: "delete",
      title: "Delete student record",
      message: `Remove ${student.lastName} (${student.id}) from ${getSectionLabel(sectionKey)}?`,
      payload: { targetSection: sectionKey, originalId: student.id },
      confirmLabel: "Delete",
    });
  };

  const handleConfirmAction = () => {
    if (!confirmState) return;

    const { type, payload } = confirmState;

    if (type === "add") {
      addStudent(payload.targetSection, payload.data);
      setToastMessage(`Added ${payload.data.lastName} to ${getSectionLabel(payload.targetSection)}.`);
    }

    if (type === "edit") {
      if (payload.targetSection === payload.originalSectionKey) {
        updateStudent(payload.targetSection, payload.originalId, payload.data);
      } else {
        deleteStudent(payload.originalSectionKey, payload.originalId);
        addStudent(payload.targetSection, payload.data);
      }
      setToastMessage(`Updated ${payload.data.lastName}'s record.`);
    }

    if (type === "delete") {
      deleteStudent(payload.targetSection, payload.originalId);
      setToastMessage("Student record deleted.");
    }

    setConfirmState(null);
    closeDialog();
  };

  const handleLogout = () => {
    setConfirmState({
      type: "logout",
      title: "Sign out",
      message: "Sign out of the super admin dashboard?",
      confirmLabel: "Sign out",
    });
  };

  const executeLogout = () => {
    clearSuperAdminSession();
    navigate("/", { replace: true });
  };

  const dismissConfirm = () => setConfirmState(null);

  return (
    <div className="adminShell adminShell--dashboard">
      <header className="adminHeader">
        <div>
          <p className="adminHeader_code">Access code: {SUPER_ADMIN_CODE}</p>
          <h1>Super Admin Dashboard</h1>
          <p className="adminHeader_subtitle">Manage student records across Sections 2, 4, and 5.</p>
        </div>
        <div className="adminHeader_actions">
          <button type="button" className="adminSecondaryButton" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="adminMain">
        <section className="adminPanel">
          <div className="adminPanel_header">
            <div className="adminTabs" role="tablist">
              {SECTION_OPTIONS.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  role="tab"
                  className={`adminTab${selectedSection === section.key ? " is-active" : ""}`}
                  aria-selected={selectedSection === section.key}
                  onClick={() => setSelectedSection(section.key)}
                >
                  {section.label}
                  <span className="adminBadge">{(studentsBySection[section.key] ?? []).length}</span>
                </button>
              ))}
            </div>
            <button type="button" className="adminPrimaryButton" onClick={openAddDialog}>
              Add student
            </button>
          </div>

          <div className="adminTable_wrapper">
            <table className="adminTable">
              <thead>
                <tr>
                  <th scope="col">ID number</th>
                  <th scope="col">Last name</th>
                  <th scope="col">Final grade</th>
                  <th scope="col" className="adminTable_actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="adminTable_empty">
                      No records yet for {getSectionLabel(selectedSection)}.
                    </td>
                  </tr>
                ) : (
                  selectedStudents.map((student) => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td>{student.lastName}</td>
                      <td>{student.finalsGrade}</td>
                      <td className="adminTable_actions">
                        <button
                          type="button"
                          className="adminLinkButton"
                          onClick={() => openEditDialog(student, selectedSection)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="adminLinkButton adminLinkButton--danger"
                          onClick={() => handleDelete(selectedSection, student)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <FormDialog
        isOpen={dialogMode !== null}
        mode={dialogMode}
        formState={formState}
        formErrors={formErrors}
        onClose={closeDialog}
        onChange={handleFormChange}
        onSubmit={handleFormSubmit}
      />

      <ConfirmationModal
        isOpen={Boolean(confirmState)}
        title={confirmState?.title ?? ""}
        message={confirmState?.message ?? ""}
        confirmLabel={confirmState?.confirmLabel ?? "Confirm"}
        onConfirm={() => {
          if (confirmState?.type === "logout") {
            executeLogout();
            dismissConfirm();
            return;
          }
          handleConfirmAction();
        }}
        onCancel={dismissConfirm}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage("")} />
    </div>
  );
}

function getSectionLabel(sectionKey) {
  return SECTION_OPTIONS.find((section) => section.key === sectionKey)?.label ?? "the selected section";
}

export default SuperAdminDashboard;
