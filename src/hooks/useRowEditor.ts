import { useState } from 'react';

export function useRowEditor<T extends { id: number }>() {
  const [editingItem, setEditingItem] = useState<T | null>(null);

  function startEditing(item: T) {
    setEditingItem({ ...item });
  }

  function cancelEditing() {
    setEditingItem(null);
  }

  function updateField<K extends keyof T>(
    field: K,
    value: T[K]
  ) {
    setEditingItem((current) =>
      current
        ? { ...current, [field]: value }
        : null
    );
  }

  function isEditing(item: T) {
    return editingItem?.id === item.id;
  }

  return {
    editingItem,
    startEditing,
    cancelEditing,
    updateField,
    isEditing,
  };
}