import { useState, useEffect } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import DashboardHome from "../components/DashboardHome";
import ATSAnalyzer from "../components/ATSAnalyzer";
import OptimizeResume from "../components/OptimizeResume";
import Contact from "../components/Contact";
import API from "../config/api";

function Dashboard({ initialPage = "dashboard" }) {
  const [activePage, setActivePage] = useState(initialPage);

  useEffect(() => {
    if (initialPage) {
      setActivePage(initialPage);
    }
  }, [initialPage]);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <DashboardHome
            historyEndpoint={`${API}/ats/history`}
            apiEndpoint={`${API}/ats/latest`}
            onNavigate={setActivePage}
          />
        );
      case "ats":
        return <ATSAnalyzer />;
      case "optimize":
        return <OptimizeResume />;
      case "contact":
        return <Contact />;
      default:
        return <DashboardHome onNavigate={setActivePage} />;
    }
  };

  return (
    <div>
      <DashboardNavbar
        activePage={activePage}
        setActivePage={setActivePage}
      />
      {renderPage()}
    </div>
  );
}

export default Dashboard;