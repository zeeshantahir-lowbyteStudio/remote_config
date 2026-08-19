import { createContext, useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";

export const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState("");
  const [environments, setEnvironments] = useState([]);
  const [currentEnv, setCurrentEnv] = useState("dev");
  const [params, setParams] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [apps, setApps] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [history, setHistory] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    const data = await apiFetch("/api/projects");
    if (Array.isArray(data)) {
      setProjects(data.map((p) => p.name));
      if (!currentProject && data.length > 0) setCurrentProject(data[0].name);
    }
  }, [currentProject]);

  const loadEnvironments = useCallback(async () => {
    if (!currentProject) return;
    const data = await apiFetch(`/api/environments?project=${currentProject}`);
    if (Array.isArray(data)) setEnvironments(data.map((e) => e.name));
  }, [currentProject]);

  const loadParams = useCallback(async () => {
    if (!currentProject) return;
    const data = await apiFetch(`/api/params?project=${currentProject}&environment=${currentEnv}`);
    if (Array.isArray(data)) {
      setParams(data);
      setHasDraftChanges(data.some((p) => p.hasDraftChange));
    } else {
      setParams([]);
      setHasDraftChanges(false);
    }
  }, [currentProject, currentEnv]);

  const loadConditions = useCallback(async () => {
    if (!currentProject) return;
    const data = await apiFetch(`/api/conditions?project=${currentProject}&environment=${currentEnv}`);
    setConditions(Array.isArray(data) ? data : []);
  }, [currentProject, currentEnv]);

  const loadApps = useCallback(async () => {
    const data = await apiFetch("/api/apps");
    if (Array.isArray(data)) setApps(data);
  }, []);

  const loadExperiments = useCallback(async () => {
    const data = await apiFetch("/api/experiments");
    if (Array.isArray(data)) setExperiments(data);
  }, []);

  const loadHistory = useCallback(async () => {
    const data = await apiFetch("/api/history");
    if (Array.isArray(data)) setHistory(data);
  }, []);

  const loadAuditLog = useCallback(async () => {
    const data = await apiFetch("/api/audit-log");
    if (Array.isArray(data)) setAuditLog(data);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("rc_token");
    if (!token) return;
    setLoading(true);
    Promise.all([loadProjects(), loadApps(), loadExperiments(), loadHistory(), loadAuditLog()]).finally(() =>
      setLoading(false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("rc_token");
    if (!token || !currentProject) return;
    loadEnvironments();
  }, [currentProject, loadEnvironments]);

  useEffect(() => {
    const token = localStorage.getItem("rc_token");
    if (!token || !currentProject) return;
    loadParams();
    loadConditions();
  }, [currentProject, currentEnv, loadParams, loadConditions]);

  async function addProject(name) {
    await apiFetch("/api/projects", { method: "POST", body: JSON.stringify({ name }) });
    await loadProjects();
    await loadAuditLog();
  }

  async function addParam(data) {
    await apiFetch("/api/params", {
      method: "POST",
      body: JSON.stringify({ ...data, project: currentProject, environment: currentEnv }),
    });
    await loadParams();
    await loadAuditLog();
  }

  async function updateParam(id, data) {
    await apiFetch(`/api/params/${id}`, { method: "PUT", body: JSON.stringify(data) });
    await loadParams();
    await loadAuditLog();
  }

  async function deleteParam(id) {
    await apiFetch(`/api/params/${id}`, { method: "DELETE" });
    await loadParams();
    await loadAuditLog();
  }

  async function addCondition(data) {
    await apiFetch("/api/conditions", {
      method: "POST",
      body: JSON.stringify({ ...data, project: currentProject, environment: currentEnv }),
    });
    await loadConditions();
    await loadAuditLog();
  }

  async function updateCondition(id, data) {
    await apiFetch(`/api/conditions/${id}`, { method: "PUT", body: JSON.stringify(data) });
    await loadConditions();
    await loadAuditLog();
  }

  async function deleteCondition(id) {
    await apiFetch(`/api/conditions/${id}`, { method: "DELETE" });
    await loadConditions();
    await loadAuditLog();
  }

  async function addEnvironment(name) {
    await apiFetch("/api/environments", {
      method: "POST",
      body: JSON.stringify({ name, project: currentProject }),
    });
    await loadEnvironments();
    await loadAuditLog();
  }

  async function deleteEnvironment(name) {
    const list = await apiFetch(`/api/environments?project=${currentProject}`);
    const match = Array.isArray(list) ? list.find((e) => e.name === name) : null;
    if (!match) return;
    await apiFetch(`/api/environments/${match.id}`, { method: "DELETE" });
    await loadEnvironments();
    await loadAuditLog();
  }

  async function addApp(data) {
  await apiFetch("/api/apps", {
    method: "POST",
    body: JSON.stringify({ ...data, project: currentProject, environment: currentEnv }),
  });
  await loadApps();
  await loadAuditLog();
}

  async function regenerateAppKey(id) {
    await apiFetch(`/api/apps/${id}/regenerate-key`, { method: "POST" });
    await loadApps();
    await loadAuditLog();
  }

  async function deleteApp(id) {
    await apiFetch(`/api/apps/${id}`, { method: "DELETE" });
    await loadApps();
    await loadAuditLog();
  }

async function addExperiment(data) {
  await apiFetch("/api/experiments", {
    method: "POST",
    body: JSON.stringify({ ...data, project: currentProject, environment: currentEnv }),
  });
  await loadExperiments();
  await loadAuditLog();
}

  async function setExperimentStatus(id, status) {
    await apiFetch(`/api/experiments/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
    await loadExperiments();
    await loadAuditLog();
  }

  async function publishChanges(summary) {
    await apiFetch("/api/history/publish", {
      method: "POST",
      body: JSON.stringify({ project: currentProject, environment: currentEnv, summary }),
    });
    await loadParams();
    await loadHistory();
    await loadAuditLog();
  }

  const value = {
    projects, currentProject, setCurrentProject, addProject,
    environments, currentEnv, setCurrentEnv,
    params, conditions, apps, experiments, history, auditLog,
    hasDraftChanges, loading,
    addParam, updateParam, deleteParam,
    addCondition, updateCondition, deleteCondition,
    addEnvironment, deleteEnvironment,
    addApp, regenerateAppKey, deleteApp,
    addExperiment, setExperimentStatus,
    publishChanges,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}