// layouts/MainLayout.jsx
import Navbar from "../components/common/Navbar";
import { Outlet } from "react-router-dom";
import React from "react";

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
};

export default MainLayout;
