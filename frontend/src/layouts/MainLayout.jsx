import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/client";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const MainLayout = () => {
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    api
      .get("/public/contact")
      .then(({ data }) => setContactInfo(data))
      .catch(() => setContactInfo(null));
  }, []);

  return (
    <div className="app-shell">
      <div className="background-orb background-orb--one" />
      <div className="background-orb background-orb--two" />
      <Navbar />
      <main className="page-shell">
        <Outlet />
      </main>
      <Footer contactInfo={contactInfo} />
    </div>
  );
};

export default MainLayout;
