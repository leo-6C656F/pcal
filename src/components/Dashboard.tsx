import { useState } from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { Plus, Calendar, User, Edit2, Clock, ChevronRight, X } from 'lucide-react';
import type { ChildContext } from '../types';

/**
 * Dashboard Component
 * Manages children and daily entries
 */
export function Dashboard() {
  const {
    children,
    entries,
    currentChild,
    setCurrentChild,
    setCurrentEntry,
    createChild,
    updateChild,
    createEntry
  } = useStore();

  const [showChildForm, setShowChildForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildContext | null>(null);

  const [newChildData, setNewChildData] = useState({
    name: '',
    center: '',
    teacher: ''
  });

  const [newEntryData, setNewEntryData] = useState({
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleCreateChild = async () => {
    if (!newChildData.name || !newChildData.center || !newChildData.teacher) {
      alert('Please fill in all fields');
      return;
    }

    const child = await createChild(newChildData);
    setCurrentChild(child);
    setShowChildForm(false);
    setNewChildData({ name: '', center: '', teacher: '' });
  };

  const handleStartEdit = (child: ChildContext, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChild(child);
  };

  const handleUpdateChild = async () => {
    if (!editingChild) return;

    if (!editingChild.name || !editingChild.center || !editingChild.teacher) {
      alert('Please fill in all fields');
      return;
    }

    await updateChild(editingChild.id, {
      name: editingChild.name,
      center: editingChild.center,
      teacher: editingChild.teacher
    });
    setEditingChild(null);
  };

  const handleCreateEntry = async () => {
    if (!currentChild || !newEntryData.date) {
      alert('Please select a child and date');
      return;
    }

    // Check if entry already exists for this date
    const existingEntry = entries.find(
      e => e.childId === currentChild.id && e.date === newEntryData.date
    );

    if (existingEntry) {
      setCurrentEntry(existingEntry);
      setShowEntryForm(false);
      return;
    }

    const entry = await createEntry(newEntryData.date, currentChild.id);
    setCurrentEntry(entry);
    setShowEntryForm(false);
  };

  const childEntries = currentChild
    ? entries.filter(e => e.childId === currentChild.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your children and activity logs</p>
        </div>
        {!showChildForm && !showEntryForm && (
          <button
            type="button"
            onClick={() => setShowChildForm(true)}
            className="btn-primary"
          >
            <Plus size={18} className="mr-2" />
            Add Child
          </button>
        )}
      </div>

      {/* Create Child Modal/Form area */}
      {showChildForm && (
        <div className="card p-6 border-indigo-100 ring-4 ring-indigo-50/50 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Add New Child</h3>
            <button onClick={() => setShowChildForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-text">Child Name</label>
              <input
                type="text"
                value={newChildData.name}
                onChange={(e) => setNewChildData({ ...newChildData, name: e.target.value })}
                className="input-field"
                placeholder="e.g. Jane Doe"
              />
            </div>
            <div>
              <label className="label-text">Center</label>
              <input
                type="text"
                value={newChildData.center}
                onChange={(e) => setNewChildData({ ...newChildData, center: e.target.value })}
                className="input-field"
                placeholder="e.g. North Hills Head Start"
              />
            </div>
            <div>
              <label className="label-text">Teacher</label>
              <input
                type="text"
                value={newChildData.teacher}
                onChange={(e) => setNewChildData({ ...newChildData, teacher: e.target.value })}
                className="input-field"
                placeholder="e.g. Mrs. Smith"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowChildForm(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleCreateChild} className="btn-primary">
              Create Profile
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Children List (Sidebar style on large screens) */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <User size={20} className="text-indigo-600" />
            Children
          </h2>

          {children.length === 0 && !showChildForm && (
            <div className="card p-8 text-center border-dashed border-2 border-slate-300 bg-slate-50">
              <p className="text-slate-500 text-sm">No children added yet.</p>
            </div>
          )}

          <div className="space-y-3">
            {children.map((child) => (
              <div key={child.id}>
                {editingChild?.id === child.id ? (
                  <div className="card p-4 border-indigo-200 shadow-md space-y-3">
                    <input
                      type="text"
                      value={editingChild.name}
                      onChange={(e) => setEditingChild({ ...editingChild, name: e.target.value })}
                      className="input-field"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={editingChild.center}
                      onChange={(e) => setEditingChild({ ...editingChild, center: e.target.value })}
                      className="input-field"
                      placeholder="Center"
                    />
                    <input
                      type="text"
                      value={editingChild.teacher}
                      onChange={(e) => setEditingChild({ ...editingChild, teacher: e.target.value })}
                      className="input-field"
                      placeholder="Teacher"
                    />
                    <div className="flex gap-2 pt-2">
                      <button onClick={handleUpdateChild} className="btn-primary text-xs py-1.5 w-full">Save</button>
                      <button onClick={() => setEditingChild(null)} className="btn-secondary text-xs py-1.5 w-full">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCurrentChild(child)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                      currentChild?.id === child.id
                        ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${currentChild?.id === child.id ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-indigo-300'} transition-colors`}></div>
                    <div className="pl-2 flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 text-lg">{child.name}</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {child.center}
                        </p>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <User size={12} /> {child.teacher}
                        </p>
                      </div>
                      <div
                        onClick={(e) => handleStartEdit(child, e)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors z-10"
                      >
                        <Edit2 size={16} />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Entries Section */}
        <div className="lg:col-span-2 space-y-4">
          {currentChild ? (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar size={20} className="text-indigo-600" />
                  Activity Logs
                </h2>
                {!showEntryForm && (
                  <button
                    onClick={() => setShowEntryForm(true)}
                    className="btn-primary bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                  >
                    <Plus size={18} className="mr-2" />
                    New Entry
                  </button>
                )}
              </div>

              {showEntryForm && (
                <div className="card p-6 border-emerald-100 ring-4 ring-emerald-50/50 animate-in slide-in-from-top-4 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Create New Entry</h3>
                    <button onClick={() => setShowEntryForm(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={20} />
                    </button>
                  </div>
                  <div>
                    <label className="label-text">Date</label>
                    <input
                      type="date"
                      value={newEntryData.date}
                      onChange={(e) => setNewEntryData({ date: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button onClick={() => setShowEntryForm(false)} className="btn-secondary">
                      Cancel
                    </button>
                    <button onClick={handleCreateEntry} className="btn-primary bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500">
                      Create Entry
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {childEntries.length === 0 ? (
                  <div className="card p-12 text-center border-dashed border-2 border-slate-200 bg-slate-50">
                    <div className="mx-auto w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                      <Calendar size={24} />
                    </div>
                    <h3 className="text-slate-900 font-medium">No entries yet</h3>
                    <p className="text-slate-500 text-sm mt-1">Create a new entry to start logging activities.</p>
                  </div>
                ) : (
                  childEntries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => setCurrentEntry(entry)}
                      className="w-full text-left card p-5 hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                            entry.signatureBase64 ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {format(new Date(entry.date), 'dd')}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-lg">
                              {format(new Date(entry.date), 'MMMM yyyy')}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-slate-500 flex items-center gap-1">
                                <Clock size={14} />
                                {format(new Date(entry.date), 'EEEE')}
                              </span>
                              <span className="text-sm text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-full">
                                {entry.lines.length} Activities
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {entry.signatureBase64 && (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                              Signed
                            </span>
                          )}
                          <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <User size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Select a Child</h3>
              <p className="text-slate-500 mt-1 max-w-sm">
                Select a child from the list on the left or create a new profile to manage activity logs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
