import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { publicApi } from "../api/client";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { fallbackContactInfo, mergeSiteContent } from "../utils/fallbackContent";

const MainLayout = () => {
  const location = useLocation();
  const [contactInfo, setContactInfo] = useState(fallbackContactInfo);

  useEffect(() => {
    publicApi
      .get("/public/contact")
      .then(({ data }) => setContactInfo(mergeSiteContent(data)))
      .catch(() => setContactInfo(fallbackContactInfo));
  }, []);

  useEffect(() => {
    if (location.hash) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const targetId = location.hash.slice(1);
    const frameId = window.requestAnimationFrame(() => {
      const target = document.getElementById(targetId);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash, location.pathname]);

  return (
    <div className="app-shell">
      <div className="background-orb background-orb--one" />
      <div className="background-orb background-orb--two" />
      <Navbar />
      <main className="page-shell">
        <Outlet context={{ contactInfo, setContactInfo }} />
      </main>
      <Footer contactInfo={contactInfo} />
    </div>
  );
};

export default MainLayout;
