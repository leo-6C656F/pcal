import { useState } from 'react';
import { useStore } from '../store';
import { format } from 'date-fns';
import { Plus, Calendar, User } from 'lucide-react';

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
    createEntry
  } = useStore();

  const [showChildForm, setShowChildForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);

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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900">PCAL Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Parent-Child Activity Log</p>
      </div>

      {/* Children Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Children</h2>
          <button
            type="button"
            onClick={() => setShowChildForm(!showChildForm)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            <Plus size={16} />
            Add Child
          </button>
        </div>

        {showChildForm && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
            <input
              type="text"
              placeholder="Child's Name"
              value={newChildData.name}
              onChange={(e) => setNewChildData({ ...newChildData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              placeholder="Center Name"
              value={newChildData.center}
              onChange={(e) => setNewChildData({ ...newChildData, center: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              placeholder="Teacher Name"
              value={newChildData.teacher}
              onChange={(e) => setNewChildData({ ...newChildData, teacher: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateChild}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Create Child
              </button>
              <button
                type="button"
                onClick={() => setShowChildForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {children.length === 0 && (
            <p className="text-sm text-gray-500">No children added yet</p>
          )}
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setCurrentChild(child)}
              className={`w-full text-left px-4 py-3 border rounded-md hover:bg-gray-50 ${
                currentChild?.id === child.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{child.name}</p>
                  <p className="text-sm text-gray-600">
                    {child.center} | {child.teacher}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Entries Section */}
      {currentChild && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Activity Logs for {currentChild.name}
            </h2>
            <button
              type="button"
              onClick={() => setShowEntryForm(!showEntryForm)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-600 border border-green-600 rounded-md hover:bg-green-50"
            >
              <Plus size={16} />
              New Entry
            </button>
          </div>

          {showEntryForm && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md space-y-3">
              <input
                type="date"
                value={newEntryData.date}
                onChange={(e) => setNewEntryData({ date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateEntry}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Create Entry
                </button>
                <button
                  type="button"
                  onClick={() => setShowEntryForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {childEntries.length === 0 && (
              <p className="text-sm text-gray-500">No entries yet</p>
            )}
            {childEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setCurrentEntry(entry)}
                className="w-full text-left px-4 py-3 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {format(new Date(entry.date), 'MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {entry.lines.length} activities
                      </p>
                    </div>
                  </div>
                  {entry.signatureBase64 && (
                    <span className="text-xs text-green-600">✓ Signed</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
