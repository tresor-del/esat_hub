import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Logo from "./Logo";

const TeacherNavbar = (props) => {
  const isMobile = window.innerWidth < 768;
  const { user } = useAuth();


  const getLogo = (
    <div style={{ display: "flex" }}>
      {isMobile && (
        <div></div>
      )}
      <Link to="/teacher" className="navbar-logo">
        <Logo size={isMobile ? 40 : 45} />
        {isMobile ? (
          <h3>EsatHub</h3>
        ) : (
          <h1>EsatHub</h1>
        )}
      </Link>
    </div>
  );


  return (
    <>
      <div className="t-nav-container">
        <div className="logo">
          {getLogo}
        </div>
        <div className="name">
          <h1>{user?.full_name}/{user?.subject}</h1>
        </div>
      </div>
    </>
  );
};

export default TeacherNavbar;