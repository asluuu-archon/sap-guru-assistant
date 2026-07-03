import { useEffect, useState } from "react";
import { getDashboardData } from "../services/api";

export function useDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardData()
      .then((data) => {
        setDashboard(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load dashboard");
        setLoading(false);
      });
  }, []);

  return {
    dashboard,
    loading,
    error,
  };
}