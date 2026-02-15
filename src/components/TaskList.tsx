import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { useAppDispatch, useAppSelector } from '../store';
import { clearConflicts, loadTasks, performSync, setOnline } from '../store/tasksSlice';
import NetInfo from '@react-native-community/netinfo';
import type { Task } from '../types';

export default function TaskList() {
  const dispatch = useAppDispatch();
  const { items, isOnline, conflicts } = useAppSelector(state => state.tasks);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => {
    dispatch(loadTasks());
  }, [dispatch]);

  useEffect(() => {
    const sub = NetInfo.addEventListener(state => {
      const online = Boolean(state.isConnected && state.isInternetReachable);
      dispatch(setOnline(online));
    });
    return () => sub();
  }, [dispatch]);

  useEffect(() => {
    if (isOnline) {
      dispatch(performSync());
    }
  }, [isOnline, dispatch]);

  const openAdd = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (t: Task) => {
    setEditing(t);
    setShowForm(true);
  };

  const renderItem = ({ item }: { item: Task }) => (
    <TaskItem task={item} onEdit={openEdit} />
  );

  const serverWins = useMemo(
    () => conflicts.filter(c => c.resolvedTo === 'server').map(c => ({ id: c.id })),
    [conflicts],
  );
  const localWins = useMemo(
    () => conflicts.filter(c => c.resolvedTo === 'local').map(c => ({ id: c.id })),
    [conflicts],
  );

  const titleById = (id: string) => {
    const t = items.find(x => x.id === id);
    return t ? t.title : id;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Tasks</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {serverWins.length > 0 && (
        <View style={[styles.banner, styles.serverBanner]}>
          <Text style={[styles.bannerTitle, styles.serverBannerTitle]}>
            Updated to the latest version from cloud
          </Text>
          {serverWins.slice(0, 5).map(s => (
            <Text key={s.id} style={styles.bannerItem}>
              {titleById(s.id)}
            </Text>
          ))}
          {serverWins.length > 5 && (
            <Text style={styles.bannerItem}>+ {serverWins.length - 5} more</Text>
          )}
          <TouchableOpacity style={styles.bannerDismiss} onPress={() => dispatch(clearConflicts())}>
            <Text style={styles.bannerDismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {serverWins.length === 0 && localWins.length > 0 && (
        <View style={[styles.banner, styles.localBanner]}>
          <Text style={[styles.bannerTitle, styles.localBannerTitle]}>
            Your offline changes were synced successfully
          </Text>
          <TouchableOpacity style={styles.bannerDismiss} onPress={() => dispatch(clearConflicts())}>
            <Text style={styles.bannerDismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={t => t.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <TaskForm visible={showForm} onClose={() => setShowForm(false)} editing={editing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6' },
  headerRow: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  header: { fontSize: 20, fontWeight: '700' },
  addBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#2d7cff', borderRadius: 8 },
  addText: { color: '#fff', fontWeight: '700' },
  list: { padding: 16 },
  banner: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  serverBanner: { backgroundColor: '#fff5e6', borderColor: '#f0d3a6' },
  localBanner: { backgroundColor: '#e9f9ee', borderColor: '#c9ecd3' },
  bannerTitle: { fontWeight: '700', marginBottom: 6 },
  serverBannerTitle: { color: '#a87100' },
  localBannerTitle: { color: '#1f7a45' },
  bannerItem: { color: '#6a4b00' },
  bannerDismiss: { marginTop: 8, alignSelf: 'flex-start', padding: 6, borderRadius: 6, backgroundColor: '#ddd' },
  bannerDismissText: { color: '#333', fontWeight: '600' },
});
