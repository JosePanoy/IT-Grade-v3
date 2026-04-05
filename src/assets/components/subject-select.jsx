import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/subject-select.css";
import backIcon from "../img/back.png";

function SubjectSelect() {
  const navigate = useNavigate();

  return (
    <div className="gradeLookup">
      <header className="gradeLookup_header">
        <button type="button" className="gradeLookup_backButton" onClick={() => navigate("/")}>
          <img src={backIcon} alt="" aria-hidden="true" className="gradeLookup_backIcon" />
          <span>Homepage</span>
        </button>
        <div className="gradeLookup_intro">
          <h1>Select Subject</h1>
          <p>Current active subject for School Year 2025-2026, 2nd Semester.</p>
        </div>
      </header>

      <main className="gradeLookup_form">
        <ul className="subjectSelect_grid">
          <li>
            <button type="button" className="subjectSelect_card" disabled>
              <span className="subjectSelect_code">ITCC112</span>
              <span className="subjectSelect_hint">Temporarily unavailable</span>
            </button>
          </li>
          <li>
            <button type="button" className="subjectSelect_card" disabled>
              <span className="subjectSelect_code">ITPD1</span>
              <span className="subjectSelect_hint">Temporarily unavailable</span>
            </button>
          </li>
          <li>
            <button type="button" className="subjectSelect_card" onClick={() => navigate("/lookup/ITCC121")}>
              <span className="subjectSelect_code">ITCC121</span>
              <span className="subjectSelect_hint">Tap to continue</span>
            </button>
          </li>
        </ul>
      </main>
    </div>
  );
}

export default SubjectSelect;
