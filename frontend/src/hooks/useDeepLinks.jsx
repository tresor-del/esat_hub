import { useEffect } from "react";
import { App } from "@capacitor/app";
import { useNavigate } from "react-router-dom";

export const useDeepLinks = () => {
  const navigate = useNavigate();

  useEffect(() => {
  let listenerHandle;

  App.addListener("appUrlOpen", (event) => {
    try {
      const url = new URL(event.url);
      const path = url.pathname + url.search;
      navigate(path);
    } catch (err) {
      console.error("Erreur parsing deep link:", err);
    }
  }).then((handle) => {
    listenerHandle = handle;
  });

  return () => {
    listenerHandle?.remove();
  };
}, [navigate]);

};
