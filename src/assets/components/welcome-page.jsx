import React from "react";
import { motion } from "framer-motion";
import "../css/welcome-page.css";
import { FaRegSmileWink } from "react-icons/fa";
import WITLogo from "../img/WIT.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut", when: "beforeChildren", staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function WelcomePage({ onStartLookup = () => {} }) {
  return (
    <motion.div className="welcome_page" initial="hidden" animate="visible" variants={containerVariants}>
      <motion.header className="welcome_header" variants={itemVariants}>
        <div className="welcome_brand">
          <img className="welcome_logo" src={WITLogo} alt="Western Institute of Technology logo" />
          <div className="welcome_brandText">
            <span className="welcome_school">Western Institute of Technology</span>
            <span className="welcome_portal">1st Semester Final Grades Portal</span>
          </div>
        </div>
        <motion.div className="welcome_session" variants={itemVariants}>
          <span className="welcome_sessionTag">School Year 2025 - 2026</span>
          <span className="welcome_versionTag">IT-Grades V1.0.0.0.1</span>
        </motion.div>
      </motion.header>

      <motion.main className="welcome_main" variants={containerVariants}>
        <motion.section className="welcome_hero" variants={itemVariants}>
          <h1 className="welcome_title">Welcome to your grade dashboard.</h1>
          <p className="welcome_subtitle">
            Review your first semester performance with clarity. Track each subject, understand trends, and stay ready
            for what&apos;s next.
          </p>
          <div className="welcome_ctaGroup">
            <button type="button" className="welcome_primaryButton" onClick={onStartLookup}>
              View my grades
            </button>
            <span className="welcome_helper">Prepare your student ID to continue.</span>
          </div>
        </motion.section>

        <motion.section className="welcome_note" variants={itemVariants}>
          <h2 className="welcome_noteTitle">From Jan Rasheed Calderon</h2>
          <p className="welcome_noteBody">
            I built this space so my students can conveniently review their final grades for the semester. Expect more
            features soon as I continue improving the experience for every section I guide.
          </p>
        </motion.section>

      </motion.main>

      <motion.footer className="welcome_footer" variants={itemVariants}>
        <div className="welcome_footerCopy">
          Please follow me on Instagram haha <FaRegSmileWink className="welcome_footerIcon" />{" "}
          <a href="https://www.instagram.com/Josepanoy" target="_blank" rel="noreferrer">
            @josepanoy
          </a>
        </div>
        <div className="welcome_status">Updates roll out whenever I get the time to fine-tune the portal.</div>
      </motion.footer>
    </motion.div>
  );
}

export default WelcomePage;
