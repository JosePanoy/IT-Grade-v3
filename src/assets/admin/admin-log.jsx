import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/admin.css";
import { SUPER_ADMIN_CODE, hasSuperAdminSession, storeSuperAdminSession } from "./auth-utils.js";
import backIcon from "../img/back.png";

function SuperAdminLogin() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (hasSuperAdminSession()) {
      navigate("/itgrade-v3/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Please enter the access code.");
      return;
    }

    setIsSubmitting(true);
    window.setTimeout(() => {
      if (trimmedCode === SUPER_ADMIN_CODE) {
        storeSuperAdminSession();
        navigate("/itgrade-v3/dashboard", { replace: true });
      } else {
        setError("Invalid access code. Please try again.");
      }
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="adminShell">
      <form className="adminCard" onSubmit={handleSubmit}>
        <h1>Super Admin Access</h1>
        <p className="adminCard_subtitle">Enter the passcode to manage sections 2, 4, and 5.</p>
        <label htmlFor="superAdminCode" className="adminLabel">
          Access code
        </label>
        <input
          id="superAdminCode"
          name="superAdminCode"
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="adminInput"
          placeholder="Enter 4-digit code"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            if (error) {
              setError("");
            }
          }}
          maxLength={4}
        />
        {error && <p className="adminError">{error}</p>}
        <button type="submit" className="adminPrimaryButton" disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Enter dashboard"}
        </button>
        <button
          type="button"
          className="adminSecondaryButton adminBackButton"
          onClick={() => navigate("/", { replace: true })}
        >
          <img src={backIcon} alt="" aria-hidden="true" className="adminBackButton_icon" />
          <span>Back to homepage</span>
        </button>
      </form>
    </div>
  );
}

export default SuperAdminLogin;
