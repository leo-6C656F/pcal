import { useState } from 'react';
import { useStore } from '../store';
import type { ChildContext } from '../types';

interface ChildFormProps {
  onChildCreated: (child: ChildContext) => void;
}

export function ChildForm({ onChildCreated }: ChildFormProps) {
  const { createChild } = useStore();

  const [newChildData, setNewChildData] = useState({
    name: '',
    center: '',
    teacher: ''
  });

  const [childFormErrors, setChildFormErrors] = useState({
    name: '',
    center: '',
    teacher: ''
  });

  const [isCreatingChild, setIsCreatingChild] = useState(false);

  const validateChildForm = () => {
    const errors = {
      name: newChildData.name.trim() ? '' : 'Child name is required',
      center: newChildData.center.trim() ? '' : 'Center name is required',
      teacher: newChildData.teacher.trim() ? '' : 'Teacher name is required'
    };
    setChildFormErrors(errors);
    return !errors.name && !errors.center && !errors.teacher;
  };

  const handleCreateChild = async () => {
    if (!validateChildForm()) {
      return;
    }

    setIsCreatingChild(true);
    try {
      const child = await createChild(newChildData);
      onChildCreated(child);
    } catch (error) {
      console.error('Failed to create child:', error);
      // Optionally, show an error message to the user
    } finally {
      setIsCreatingChild(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="label-text">Child Name</label>
          <input
            type="text"
            value={newChildData.name}
            onChange={(e) => {
              setNewChildData({ ...newChildData, name: e.target.value });
              if (childFormErrors.name) {
                setChildFormErrors({ ...childFormErrors, name: '' });
              }
            }}
            className={`input-field ${childFormErrors.name ? 'border-rose-500 focus:ring-rose-500' : ''}`}
            placeholder="e.g. Jane Doe"
          />
          {childFormErrors.name && (
            <p className="mt-1 text-sm text-rose-600 flex items-center gap-1">
              <span>⚠️</span> {childFormErrors.name}
            </p>
          )}
        </div>
        <div>
          <label className="label-text">Center</label>
          <input
            type="text"
            value={newChildData.center}
            onChange={(e) => {
              setNewChildData({ ...newChildData, center: e.target.value });
              if (childFormErrors.center) {
                setChildFormErrors({ ...childFormErrors, center: '' });
              }
            }}
            className={`input-field ${childFormErrors.center ? 'border-rose-500 focus:ring-rose-500' : ''}`}
            placeholder="e.g. North Hills Head Start"
          />
          {childFormErrors.center && (
            <p className="mt-1 text-sm text-rose-600 flex items-center gap-1">
              <span>⚠️</span> {childFormErrors.center}
            </p>
          )}
        </div>
        <div>
          <label className="label-text">Teacher</label>
          <input
            type="text"
            value={newChildData.teacher}
            onChange={(e) => {
              setNewChildData({ ...newChildData, teacher: e.target.value });
              if (childFormErrors.teacher) {
                setChildFormErrors({ ...childFormErrors, teacher: '' });
              }
            }}
            className={`input-field ${childFormErrors.teacher ? 'border-rose-500 focus:ring-rose-500' : ''}`}
            placeholder="e.g. Mrs. Smith"
          />
          {childFormErrors.teacher && (
            <p className="mt-1 text-sm text-rose-600 flex items-center gap-1">
              <span>⚠️</span> {childFormErrors.teacher}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={handleCreateChild}
          className="btn-primary"
          disabled={isCreatingChild}
        >
          {isCreatingChild ? (
            <>
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              Creating...
            </>
          ) : (
            'Create Profile'
          )}
        </button>
      </div>
    </div>
  );
}
