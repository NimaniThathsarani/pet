import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity,
  Alert, Modal, ActivityIndicator, TextInput
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const CATEGORY_ICONS = ['🥩', '🐾', '🥗', '🦴', '🐟', '🥚', '🌾', '🥕'];

export default function DietScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const authHeader = { headers: { Authorization: `Bearer ${userToken}` } };

  const [tab, setTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [pets, setPets] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  // New Plan Modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [feedingEntries, setFeedingEntries] = useState([{ time: '', portion: '', notes: '' }]);

  useEffect(() => {
    fetchCategories();
    fetchPets();
  }, []);

  useEffect(() => {
    if (selectedPet) fetchRecords(selectedPet._id);
  }, [selectedPet]);

  const fetchCategories = async () => {
    try { const { data } = await api.get('/diet/categories', authHeader); setCategories(data); }
    catch (e) { console.error('fetchCategories', e); }
  };

  const fetchPets = async () => {
    try {
      const { data } = await api.get('/pets', authHeader);
      setPets(data);
      if (data.length > 0) setSelectedPet(data[0]);
    } catch (e) { console.error('fetchPets', e); }
  };

  const fetchRecords = async (petId) => {
    setLoading(true);
    try { const { data } = await api.get(`/diet/records?petId=${petId}`, authHeader); setRecords(data); }
    catch (e) { console.error('fetchRecords', e); }
    finally { setLoading(false); }
  };

  const openPlanModal = (cat) => {
    setSelectedCategory(cat);
    setFeedingEntries([{ time: '', portion: '', notes: '' }]);
    setShowPlanModal(true);
  };

  const addEntry = () => setFeedingEntries([...feedingEntries, { time: '', portion: '', notes: '' }]);
  const removeEntry = (i) => setFeedingEntries(feedingEntries.filter((_, idx) => idx !== i));
  const updateEntry = (i, field, val) => {
    const copy = [...feedingEntries];
    copy[i] = { ...copy[i], [field]: val };
    setFeedingEntries(copy);
  };

  const handleSavePlan = async () => {
    if (!selectedPet) { Alert.alert('Error', 'Select a pet first'); return; }
    const validEntries = feedingEntries.filter(e => e.time.trim() && e.portion.trim());
    if (validEntries.length === 0) {
      Alert.alert('Error', 'Add at least one feeding entry with time and portion');
      return;
    }
    try {
      await api.post('/diet/records', {
        petId: selectedPet._id,
        categoryId: selectedCategory._id,
        schedule: validEntries
      }, authHeader);
      Alert.alert('Saved! 🥗', `Feeding plan for ${selectedPet.name} added`);
      setShowPlanModal(false);
      fetchRecords(selectedPet._id);
      setTab('plans');
    } catch (e) { Alert.alert('Error', e.response?.data?.message || 'Could not save'); }
  };

  const handleDeleteRecord = (id) => {
    Alert.alert('Delete Plan', 'Remove this feeding plan?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/diet/records/${id}`, authHeader); fetchRecords(selectedPet._id); }
        catch (e) { Alert.alert('Error', 'Could not delete'); }
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backArrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Diet & Feeding</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'categories' && styles.tabActive]} onPress={() => setTab('categories')}>
          <Text style={[styles.tabText, tab === 'categories' && styles.tabTextActive]}>Diet Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'plans' && styles.tabActive]} onPress={() => setTab('plans')}>
          <Text style={[styles.tabText, tab === 'plans' && styles.tabTextActive]}>My Schedules</Text>
        </TouchableOpacity>
      </View>

      {/* Pet selector */}
      {pets.length > 0 && (
        <View style={styles.petBarWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petBar}>
            {pets.map(p => (
              <TouchableOpacity
                key={p._id}
                style={[styles.petChip, selectedPet?._id === p._id && styles.petChipActive]}
                onPress={() => setSelectedPet(p)}
              >
                <Text style={[styles.petChipText, selectedPet?._id === p._id && styles.petChipTextActive]}>🐾 {p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Diet Plan Categories Tab */}
      {tab === 'categories' && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {categories.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🥗</Text>
              <Text style={styles.emptyText}>No diet plans available yet.</Text>
            </View>
          )}
          {categories.map((c, i) => (
            <View key={c._id} style={styles.catCard}>
              <View style={styles.catTop}>
                <View style={styles.catIcon}>
                  <Text style={{ fontSize: 26 }}>{CATEGORY_ICONS[i % CATEGORY_ICONS.length]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catName}>{c.name}</Text>
                  {c.suitableFor ? (
                    <View style={styles.suitablePill}>
                      <Text style={styles.suitableText}>🐾 {c.suitableFor}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Text style={styles.catDesc}>{c.nutritionalBenefits}</Text>
              <TouchableOpacity
                style={[styles.selectBtn, !selectedPet && { opacity: 0.5 }]}
                onPress={() => openPlanModal(c)}
                disabled={!selectedPet}
              >
                <Text style={styles.selectBtnText}>
                  {selectedPet ? `Create plan for ${selectedPet.name}` : 'Select a pet above'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* My Schedules Tab */}
      {tab === 'plans' && (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {loading && <ActivityIndicator size="large" color="#5EBFA4" style={{ marginTop: 20 }} />}
          {!loading && records.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No feeding schedules for {selectedPet?.name || 'this pet'}.</Text>
              <Text style={styles.emptySub}>Go to "Diet Plans" to create one.</Text>
            </View>
          )}
          {records.map((r, ri) => (
            <View key={r._id} style={styles.recordCard}>
              <View style={styles.recordTop}>
                <View style={styles.recordIcon}>
                  <Text style={{ fontSize: 22 }}>{CATEGORY_ICONS[ri % CATEGORY_ICONS.length]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordCatName}>{r.category?.name}</Text>
                  <Text style={styles.recordPet}>🐾 {r.pet?.name} · {r.pet?.species}</Text>
                  <Text style={styles.recordDate}>📅 Since {new Date(r.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteRecord(r._id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.scheduleHeader}>Daily Feeding Schedule</Text>
              {r.schedule.map((entry, ei) => (
                <View key={ei} style={styles.entryRow}>
                  <View style={styles.entryTime}>
                    <Text style={styles.entryTimeText}>⏰ {entry.time}</Text>
                  </View>
                  <View style={styles.entryPortion}>
                    <Text style={styles.entryPortionText}>🥣 {entry.portion}</Text>
                  </View>
                  {entry.notes ? <Text style={styles.entryNotes}>{entry.notes}</Text> : null}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Create Plan Modal */}
      <Modal visible={showPlanModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Create Feeding Plan</Text>
            {selectedCategory && (
              <View style={styles.confirmCat}>
                <Text style={styles.confirmCatName}>🥗 {selectedCategory.name}</Text>
                <Text style={styles.confirmCatSub}>for {selectedPet?.name}</Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>Feeding Schedule</Text>
            <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>
              {feedingEntries.map((entry, i) => (
                <View key={i} style={styles.entryFormRow}>
                  <View style={styles.entryFormInputs}>
                    <TextInput
                      style={[styles.entryInput, { flex: 1, marginRight: 8 }]}
                      placeholder="Time (e.g. 8:00 AM)"
                      value={entry.time}
                      onChangeText={v => updateEntry(i, 'time', v)}
                    />
                    <TextInput
                      style={[styles.entryInput, { flex: 1 }]}
                      placeholder="Portion (e.g. 2 cups)"
                      value={entry.portion}
                      onChangeText={v => updateEntry(i, 'portion', v)}
                    />
                  </View>
                  <TextInput
                    style={styles.notesEntryInput}
                    placeholder="Notes (optional)"
                    value={entry.notes}
                    onChangeText={v => updateEntry(i, 'notes', v)}
                  />
                  {feedingEntries.length > 1 && (
                    <TouchableOpacity onPress={() => removeEntry(i)} style={styles.removeEntryBtn}>
                      <Text style={styles.removeEntryText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addEntryBtn} onPress={addEntry}>
                <Text style={styles.addEntryText}>+ Add Feeding Time</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.mCancelBtn} onPress={() => setShowPlanModal(false)}>
                <Text style={styles.mCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mSaveBtn} onPress={handleSavePlan}>
                <Text style={styles.mSaveText}>Save Plan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: { backgroundColor: '#5EBFA4', height: 120, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 50 },
  backBtn: { width: 40 },
  backArrow: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  tabs: { flexDirection: 'row', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#5EBFA4' },
  tabText: { fontSize: 14, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#5EBFA4', fontWeight: 'bold' },
  petBarWrap: { backgroundColor: '#FFF', paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  petBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  petChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#DDD' },
  petChipActive: { backgroundColor: '#5EBFA4', borderColor: '#5EBFA4' },
  petChipText: { fontSize: 13, color: '#555', fontWeight: 'bold' },
  petChipTextActive: { color: '#FFF' },
  list: { padding: 20, paddingBottom: 60 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 30, alignItems: 'center', marginTop: 20, elevation: 3 },
  emptyIcon: { fontSize: 48, marginBottom: 10 },
  emptyText: { fontSize: 15, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center' },
  catCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 18, marginBottom: 16, elevation: 3 },
  catTop: { flexDirection: 'row', marginBottom: 10 },
  catIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#FFF9E6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  catName: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 6 },
  suitablePill: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 2 },
  suitableText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold' },
  catDesc: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 14 },
  selectBtn: { backgroundColor: '#5EBFA4', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  selectBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  recordCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 3 },
  recordTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  recordIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF9E6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recordCatName: { fontSize: 15, fontWeight: 'bold', color: '#222', marginBottom: 2 },
  recordPet: { fontSize: 12, color: '#666', marginBottom: 2 },
  recordDate: { fontSize: 11, color: '#888' },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' },
  deleteBtnText: { color: '#C62828', fontWeight: 'bold', fontSize: 14 },
  scheduleHeader: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 8 },
  entryRow: { backgroundColor: '#F9F9F9', borderRadius: 10, padding: 10, marginBottom: 6 },
  entryTime: { marginBottom: 4 },
  entryTimeText: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  entryPortion: {},
  entryPortionText: { fontSize: 13, color: '#555' },
  entryNotes: { fontSize: 11, color: '#888', fontStyle: 'italic', marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 14 },
  confirmCat: { backgroundColor: '#FFF9E6', borderRadius: 12, padding: 14, marginBottom: 16 },
  confirmCatName: { fontSize: 15, fontWeight: 'bold', color: '#B45309' },
  confirmCatSub: { fontSize: 13, color: '#666', marginTop: 2 },
  sectionLabel: { fontSize: 13, fontWeight: 'bold', color: '#555', marginBottom: 10 },
  entryFormRow: { backgroundColor: '#F4F6F8', borderRadius: 12, padding: 12, marginBottom: 8 },
  entryFormInputs: { flexDirection: 'row', marginBottom: 6 },
  entryInput: { backgroundColor: '#FFF', padding: 10, borderRadius: 8, fontSize: 13, color: '#333' },
  notesEntryInput: { backgroundColor: '#FFF', padding: 10, borderRadius: 8, fontSize: 13, color: '#333', marginBottom: 6 },
  removeEntryBtn: { alignSelf: 'flex-end' },
  removeEntryText: { color: '#C62828', fontSize: 12, fontWeight: 'bold' },
  addEntryBtn: { backgroundColor: '#E8F5E9', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 8 },
  addEntryText: { color: '#2E7D32', fontWeight: 'bold', fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  mCancelBtn: { flex: 1, padding: 14, backgroundColor: '#F4F6F8', borderRadius: 12, alignItems: 'center' },
  mCancelText: { color: '#666', fontWeight: 'bold' },
  mSaveBtn: { flex: 1, padding: 14, backgroundColor: '#5EBFA4', borderRadius: 12, alignItems: 'center' },
  mSaveText: { color: '#FFF', fontWeight: 'bold' },
});