import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  Wifi,
  WifiOff,
  Plus,
  Trash2,
  RefreshCw,
  MapPin,
} from "lucide-react";

import "./App.css";

function App() {
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [newHost, setNewHost] = useState("");
  const [selectedHost, setSelectedHost] = useState(null);
  const [traceroute, setTraceroute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState(null);

  const API_BASE = "http://127.0.0.1:5000";

  // Fetch metrics from Flask backend
  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${API_BASE}/metrics`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMetrics(data.metrics || {});
      setAlerts(data.alerts || []);
      setLastUpdate(new Date());
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      setError(
        "Failed to connect to backend. Make sure Flask server is running."
      );
      setLoading(false);
    }
  };

  // Fetch traceroute data
  const fetchTraceroute = async (host) => {
    try {
      const response = await fetch(`${API_BASE}/api/traceroute/${host}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        console.error("Traceroute error:", data.error);
        setTraceroute(null);
        setSelectedHost(null);
      } else {
        setTraceroute(data);
        setSelectedHost(host);
      }
    } catch (error) {
      console.error("Error fetching traceroute:", error);
      setTraceroute(null);
      setSelectedHost(null);
    }
  };

  // Add host
  const handleAddHost = async () => {
    if (!newHost.trim()) return;

    const formData = new FormData();
    formData.append("host", newHost.trim());

    try {
      const response = await fetch(`${API_BASE}/add_host`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        setNewHost("");
        fetchMetrics();
      }
    } catch (error) {
      console.error("Error adding host:", error);
    }
  };

  // Remove host
  const handleRemoveHost = async (host) => {
    const formData = new FormData();
    formData.append("host", host);

    try {
      const response = await fetch(`${API_BASE}/remove_host`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        fetchMetrics();
        // Close traceroute panel if it's for the removed host
        if (selectedHost === host) {
          setTraceroute(null);
          setSelectedHost(null);
        }
      }
    } catch (error) {
      console.error("Error removing host:", error);
    }
  };

  // Poll for updates every 3 seconds
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  // Get status color
  const getLatencyColor = (latency) => {
    if (!latency) return "text-gray-400";
    if (latency < 50) return "text-green-600";
    if (latency < 150) return "text-yellow-600";
    return "text-red-600";
  };

  const getLatencyBg = (latency) => {
    if (!latency) return "bg-gray-100";
    if (latency < 50) return "bg-green-50";
    if (latency < 150) return "bg-yellow-50";
    return "bg-red-50";
  };

  // Get alert type styling
  const getAlertStyle = (type) => {
    switch (type) {
      case "anomaly":
        return "bg-red-50 border-l-4 border-red-500 text-red-800";
      case "traceroute":
        return "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800";
      case "failure":
        return "bg-red-100 border-l-4 border-red-600 text-red-900";
      case "error":
        return "bg-gray-50 border-l-4 border-gray-500 text-gray-800";
      default:
        return "bg-blue-50 border-l-4 border-blue-500 text-blue-800";
    }
  };

  // Format time ago
  const timeAgo = (timestamp) => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading network monitor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-xl p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchMetrics();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  AutoNetSim Monitor
                </h1>
                <p className="text-gray-600 mt-1">
                  Real-time network intelligence with automatic traceroute
                  analysis
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw className="w-4 h-4" />
                <span>Updated {lastUpdate.toLocaleTimeString()}</span>
              </div>
              <div className="mt-2 flex gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {Object.keys(metrics).length} Hosts
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {alerts.length} Alerts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hosts Grid */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-6">
              <Wifi className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Monitored Hosts
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(metrics).map(([host, data]) => (
                <div
                  key={host}
                  className={`${getLatencyBg(
                    data.latest
                  )} rounded-xl p-5 border-2 transition-all hover:shadow-lg`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-gray-900 text-lg truncate cursor-pointer hover:underline"
                        title={host}
                        onClick={() => {
                          if (host.match(/^[\d.]+$/)) {
                            alert(
                              "Direct IP hosts cannot be opened as websites."
                            );
                          } else {
                            const url = host.startsWith("http")
                              ? host
                              : `https://${host}`;
                            window.open(url, "_blank", "noopener,noreferrer");
                          }
                        }}
                      >
                        {host}
                      </h3>

                      <div className="flex items-center gap-2 mt-1">
                        {data.latest ? (
                          <Wifi
                            className={`w-4 h-4 ${getLatencyColor(
                              data.latest
                            )}`}
                          />
                        ) : (
                          <WifiOff className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-600">
                          {data.latest ? "Online" : "Offline"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveHost(host)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove host"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">
                        Current Latency
                      </p>
                      <p
                        className={`text-2xl font-bold ${getLatencyColor(
                          data.latest
                        )}`}
                      >
                        {data.latest ? `${data.latest}ms` : "N/A"}
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">EMA</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {data.ema}ms
                      </p>
                    </div>
                  </div>

                  {data.has_traceroute && (
                    <button
                      onClick={() => fetchTraceroute(host)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-4 h-4" />
                      View Traceroute
                    </button>
                  )}
                </div>
              ))}
            </div>

            {Object.keys(metrics).length === 0 && (
              <div className="text-center py-12">
                <WifiOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  No hosts being monitored
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Add a host below to start monitoring
                </p>
              </div>
            )}
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-6">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Recent Alerts
              </h2>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {alerts.length > 0 ? (
                alerts
                  .slice()
                  .reverse()
                  .map((alert, idx) => (
                    <div
                      key={idx}
                      className={`${getAlertStyle(alert[2])} rounded-lg p-4`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert[1]}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {timeAgo(alert[0])}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-green-700 font-medium">
                    All systems healthy
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    No alerts detected
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Add Host */}
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Add Host</h2>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={newHost}
                onChange={(e) => setNewHost(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddHost()}
                placeholder="IP address or hostname"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
              <button
                onClick={handleAddHost}
                disabled={!newHost.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Host
              </button>
            </div>
          </div>

          {/* Traceroute Panel */}
          {traceroute && (
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 truncate pr-2">
                  Traceroute: {selectedHost}
                </h2>
                <button
                  onClick={() => {
                    setTraceroute(null);
                    setSelectedHost(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none font-bold"
                >
                  ×
                </button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>{traceroute.hop_count}</strong> hops
                  {traceroute.total_latency && (
                    <>
                      {" | "}
                      <strong className="ml-2">
                        {traceroute.total_latency.toFixed(1)}ms
                      </strong>{" "}
                      total
                    </>
                  )}
                </p>
              </div>

              {traceroute.problems && traceroute.problems.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Issues Found
                  </h3>
                  {traceroute.problems.map((problem, idx) => (
                    <div
                      key={idx}
                      className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-2"
                    >
                      <p className="text-sm text-red-800">
                        {problem.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto space-y-2">
                {traceroute.hops && traceroute.hops.length > 0 ? (
                  traceroute.hops.map((hop) => (
                    <div
                      key={hop.hop}
                      className="bg-gray-50 rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-900">
                          Hop {hop.hop}
                        </span>
                        <span
                          className={`font-bold ${getLatencyColor(
                            hop.latency_avg
                          )}`}
                        >
                          {hop.latency_avg.toFixed(1)}ms
                        </span>
                      </div>
                      <p
                        className="text-gray-600 text-xs truncate"
                        title={hop.ip}
                      >
                        {hop.ip}
                      </p>
                      {hop.hostname && (
                        <p
                          className="text-gray-500 text-xs truncate"
                          title={hop.hostname}
                        >
                          {hop.hostname}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No hop data available
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="bg-gradient-to-br from-blue-300 via-indigo-400 to-blue-500 rounded-2xl shadow-xl p-6 text-gray-900">
            <h2 className="text-2xl font-extrabold mb-5 tracking-wide text-gray-800">
              System Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Total Hosts</span>
                <span className="text-3xl font-bold text-gray-900">
                  {Object.keys(metrics).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Active Alerts</span>
                <span className="text-3xl font-bold text-red-700">
                  {alerts.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Online Hosts</span>
                <span className="text-3xl font-bold text-green-800">
                  {Object.values(metrics).filter((m) => m.latest).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
