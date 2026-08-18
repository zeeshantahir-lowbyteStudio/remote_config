import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="1027051066092-v7j3k9luekhhngb0jiul964no9vn3tgb.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);