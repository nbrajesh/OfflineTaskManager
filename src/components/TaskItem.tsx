import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Task } from '../types';
import { useAppDispatch } from '../store';
import { deleteTask, toggleComplete } from '../store/tasksSlice';

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function TaskItem({ task, onEdit }: Props) {
  const dispatch = useAppDispatch();
  const onToggle = () =>
    dispatch(
      toggleComplete({
        id: task.id,
        status: task.status === 'Completed' ? 'Pending' : 'Completed',
      }),
    );
  const onDelete = () => dispatch(deleteTask(task.id));

  return (
    <View style={styles.item}>
      <View style={styles.row}>
        <Text style={[styles.title, task.status === 'Completed' && styles.completed]}>
          {task.title}
        </Text>
        <Text style={styles.status}>{task.status}</Text>
      </View>
      <Text style={styles.desc}>{task.description}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>Updated: {new Date(task.lastUpdated).toLocaleString()}</Text>
        {!task.isSynced && <Text style={styles.unsynced}>Unsynced</Text>}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={onToggle}>
          <Text style={styles.btnText}>
            {task.status === 'Completed' ? 'Mark Incomplete' : 'Mark Complete'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => onEdit(task)}>
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.delete]} onPress={onDelete}>
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600' },
  completed: { textDecorationLine: 'line-through', color: '#888' },
  status: { fontSize: 12, color: '#444' },
  desc: { marginTop: 6, fontSize: 14, color: '#333' },
  meta: { fontSize: 12, color: '#666', marginTop: 6 },
  unsynced: { fontSize: 12, color: '#c0392b', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#2d7cff' },
  delete: { backgroundColor: '#e74c3c' },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
