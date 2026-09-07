import React, { useState, useEffect } from "react";
import { adminAPI } from "../../services/api";
import {
  Building2,
  Mail,
  PlusCircle,
  Edit2,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  X
} from "lucide-react";

export const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);

  const [formData, setFormData] = useState({
    department_name: "",
    department_email: "",
    description: "",
    active: true
  });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = () => {
    setLoading(true);
    adminAPI.getDepartments()
      .then((res) => {
        if (res.data && res.data.departments) {
          setDepartments(res.data.departments);
        }
      })
      .catch((err) => console.error("Failed to load departments:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openCreateModal = () => {
    setEditingDept(null);
    setFormData({
      department_name: "",
      department_email: "",
      description: "",
      active: true
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      department_name: dept.department_name,
      department_email: dept.department_email || "",
      description: dept.description || "",
      active: dept.active !== false
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      if (editingDept) {
        const res = await adminAPI.updateDepartment(editingDept.id, formData);
        if (res.data && res.data.success) {
          setModalOpen(false);
          setFormSuccess("Department updated successfully!");
          fetchDepartments();
        }
      } else {
        const res = await adminAPI.createDepartment(formData);
        if (res.data && res.data.success) {
          setModalOpen(false);
          setFormSuccess("New department created successfully!");
          fetchDepartments();
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save department.");
    } finally {
      setSubmitting(false);
      setTimeout(() => setFormSuccess(""), 4000);
    }
  };

  const toggleActive = async (dept) => {
    try {
      await adminAPI.updateDepartment(dept.id, { active: !dept.active });
      fetchDepartments();
    } catch (err) {
      alert("Failed to toggle department status.");
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Municipal Departments Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure municipal units, dispatch emails, and active routing status stored in MongoDB
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" /> Add New Department
        </button>
      </div>

      {formSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center shadow-xs">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          {formSuccess}
        </div>
      )}

      {/* Departments Grid/Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : departments.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No departments configured</h3>
            <p className="text-xs text-slate-400">Run seed script or add your first department above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Department Name</th>
                  <th className="py-3.5 px-4">Official Dispatch Email</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Active Cases</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mr-2.5 shrink-0">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      {dept.department_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      {dept.department_email}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-[250px] truncate">
                      {dept.description || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {dept.complaint_count || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => toggleActive(dept)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          dept.active !== false
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-slate-100 text-slate-500 border-slate-300"
                        }`}
                      >
                        {dept.active !== false ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Department"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Department Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingDept ? "Edit Department" : "Create New Department"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1.5 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={formData.department_name}
                  onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                  placeholder="e.g. Roads & Infrastructure"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Official Dispatch Email *</label>
                <input
                  type="email"
                  required
                  value={formData.department_email}
                  onChange={(e) => setFormData({ ...formData, department_email: e.target.value })}
                  placeholder="roads@city.gov"
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Scope of municipal services and field team responsibilities..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="activeCheck" className="font-semibold text-slate-800">
                  Active for Automatic Dispatch & Routing
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingDept ? "Update Department" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
