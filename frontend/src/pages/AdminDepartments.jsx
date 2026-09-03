import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Building2, Mail, Edit2, Save, X, PlusCircle, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", description: "" });

  // Add State
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", email: "", description: "" });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/api/departments");
      if (res.data.success) {
        setDepartments(res.data.departments || []);
      }
    } catch (err) {
      setError("Failed to fetch departments from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const startEdit = (dept) => {
    setEditingId(dept.id);
    setEditForm({ name: dept.name, email: dept.email, description: dept.description || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await API.put(`/api/departments/${id}`, editForm);
      if (res.data.success) {
        setSuccess(`Department ${editForm.name} updated successfully`);
        setEditingId(null);
        fetchDepartments();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update department");
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/api/departments", newForm);
      if (res.data.success) {
        setSuccess(`Department ${newForm.name} created successfully`);
        setShowAdd(false);
        setNewForm({ name: "", email: "", description: "" });
        fetchDepartments();
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create department");
    }
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="dashboard-hero">
        <div>
          <h1 className="dashboard-title">Department Email Directory</h1>
          <p className="dashboard-subtitle">
            Configure automated routing email addresses for municipal departments in PostgreSQL.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={fetchDepartments} className="btn-secondary-action">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary-action">
            <PlusCircle size={16} />
            <span>{showAdd ? "Close Form" : "Add Department"}</span>
          </button>
        </div>
      </div>

      {success && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "1.5rem"
          }}
        >
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="auth-error-banner" style={{ marginBottom: "1.5rem" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Add New Department Form */}
      {showAdd && (
        <div className="dashboard-card" style={{ marginBottom: "1.5rem", border: "2px solid #2563eb" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", color: "#0f172a", fontWeight: "700" }}>
            Add New Official Department
          </h3>
          <form onSubmit={handleCreateDepartment} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label className="form-label">Department Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Urban Forestry"
                value={newForm.name}
                onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Dispatch Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="forestry@city.gov"
                value={newForm.email}
                onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label">Description / Scope of Work</label>
              <input
                type="text"
                className="form-input"
                placeholder="Responsible for urban tree planting and maintenance"
                value={newForm.description}
                onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
              />
            </div>
            <div style={{ gridColumn: "span 2", display: "flex", gap: "10px", marginTop: "8px" }}>
              <button type="submit" className="btn-primary-action">
                <Save size={16} />
                <span>Save Department</span>
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary-action">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Departments Table */}
      <div className="dashboard-card">
        <div className="table-responsive">
          <table className="civic-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Department Name</th>
                <th>Notification Email</th>
                <th>Municipal Scope & Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => {
                const isEditing = editingId === d.id;

                return (
                  <tr key={d.id}>
                    <td style={{ fontWeight: "700", color: "#64748b" }}>#{d.id}</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      ) : (
                        <strong style={{ color: "#0f172a" }}>{d.name}</strong>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="email"
                          className="form-input"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      ) : (
                        <span style={{ color: "#2563eb", fontWeight: "600", fontSize: "0.85rem" }}>
                          {d.email}
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: "340px", fontSize: "0.82rem", color: "#64748b" }}>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        />
                      ) : (
                        d.description || "N/A"
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => handleSaveEdit(d.id)}
                            className="btn-primary-action"
                            style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                            title="Save"
                          >
                            <Save size={14} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="btn-secondary-action"
                            style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(d)}
                          className="btn-secondary-action"
                          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
