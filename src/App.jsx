import { useState } from "react";
import WelcomePage from "./assets/components/welcome-page.jsx";
import GradeLookup from "./assets/components/grade-lookup.jsx";

function App() {
  const [activeView, setActiveView] = useState("welcome");

  if (activeView === "lookup") {
    return <GradeLookup onBack={() => setActiveView("welcome")} />;
  }

  return (
    <>
      <WelcomePage onStartLookup={() => setActiveView("lookup")} />
    </>
  );
}

export default App;
