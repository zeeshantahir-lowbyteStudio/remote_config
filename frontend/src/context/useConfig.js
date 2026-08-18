import { useContext } from "react";
import { ConfigContext } from "./ConfigContext";

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used inside ConfigProvider");
  return ctx;
}