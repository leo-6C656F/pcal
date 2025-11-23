import { useState } from 'react';
import { useStore } from '../store';
import { User, Edit2 } from 'lucide-react';
import type { ChildContext } from '../types';

interface ChildListItemProps {
  child: ChildContext;
  isSelected: boolean;
  onSelect: (child: ChildContext) => void;
}

export function ChildListItem({ child, isSelected, onSelect }: ChildListItemProps) {
  const { updateChild } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedChild, setEditedChild] = useState(child);
  const [isUpdatingChild, setIsUpdatingChild] = useState(false);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditedChild(child);
  };

  const handleUpdateChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editedChild) return;

    if (!editedChild.name.trim() || !editedChild.center.trim() || !editedChild.teacher.trim()) {
      // Basic validation, you might want to show errors
      return;
    }

    setIsUpdatingChild(true);
    try {
      await updateChild(editedChild.id, {
        name: editedChild.name,
        center: editedChild.center,
        teacher: editedChild.teacher
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update child:', error);
    } finally {
      setIsUpdatingChild(false);
    }
  };

  if (isEditing) {
    return (
      <div className="card p-4 border-indigo-200 shadow-md space-y-3">
        <input
          type="text"
          value={editedChild.name}
          onChange={(e) => setEditedChild({ ...editedChild, name: e.target.value })}
          className="input-field"
          placeholder="Name"
          onClick={(e) => e.stopPropagation()}
        />
        <input
          type="text"
          value={editedChild.center}
          onChange={(e) => setEditedChild({ ...editedChild, center: e.target.value })}
          className="input-field"
          placeholder="Center"
          onClick={(e) => e.stopPropagation()}
        />
        <input
          type="text"
          value={editedChild.teacher}
          onChange={(e) => setEditedChild({ ...editedChild, teacher: e.target.value })}
          className="input-field"
          placeholder="Teacher"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleUpdateChild}
            className="btn-primary text-xs py-1.5 w-full"
            disabled={isUpdatingChild}
          >
            {isUpdatingChild ? (
              <>
                <div className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
          <button
            onClick={handleCancelEdit}
            className="btn-secondary text-xs py-1.5 w-full"
            disabled={isUpdatingChild}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(child)}
      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
        isSelected
          ? 'bg-white border-primary shadow-md ring-1 ring-primary'
          : 'bg-white border-slate-200 hover:border-primary/50 hover:shadow-md'
      }`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isSelected ? 'bg-primary' : 'bg-transparent group-hover:bg-primary/50'} transition-colors`}></div>
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
          onClick={handleStartEdit}
          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors z-10"
        >
          <Edit2 size={16} />
        </div>
      </div>
    </button>
  );
}
