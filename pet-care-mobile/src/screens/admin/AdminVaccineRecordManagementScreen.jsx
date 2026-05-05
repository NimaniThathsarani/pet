import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function AdminVaccineRecordManagementScreen({ navigation }) {
  const { userToken } = useContext(AuthContext);
  const authHeader = { headers: { Authorization: `Bearer ${userToken}` } };

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vaccines/records/admin/all', authHeader);
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.response?.data?.message || 'Could not load records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecords();
  };

  const deleteRecord = (id, petName, vaccineName) => {
    Alert.alert(
      'Delete Record',
      `Remove "${vaccineName}" record for ${petName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/vaccines/records/${id}`, authHeader);
              Alert.alert('Success', 'Record deleted');
              fetchRecords();
            } catch (e) {
              Alert.alert('Error', e.response?.data?.message || 'Delete failed');
            }
          },
        },
      ]
    );
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backArrow}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Vaccination Records</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#5EBFA4" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5EBFA4']} />}
        >
          {records.length === 0 ? (
            <View style={styles.emptyCard}>
              <FontAwesome5 name="syringe" size={48} color="#CCC" />
              <Text style={styles.emptyTitle}>No records found</Text>
              <Text style={styles.emptySub}>All pet vaccination histories will appear here.</Text>
            </View>
          ) : (
            records.map((r) => (
              <View key={r._id} style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{r.pet?.name || 'Unknown Pet'}</Text>
                    <Text style={styles.ownerName}>Owner: {r.owner?.name || 'Unknown'}</Text>
                  </View>
                  <View style={styles.vaccineDetails}>
                    <Text style={styles.vaccineName}>{r.vaccineName}</Text>
                    <Text style={styles.recordDate}>
                      {r.status === 'Completed' ? 'Given: ' : 'Listed: '}
                      {formatDate(r.dateAdministered || r.createdAt)}
                    </Text>
                    <View style={[styles.statusBadge, r.status === 'Completed' ? styles.badgeDone : styles.badgeListed]}>
                      <Text style={styles.statusText}>{r.status}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => deleteRecord(r._id, r.pet?.name || 'Pet', r.vaccineName)}
                  style={styles.deleteBtn}
                >
                  <FontAwesome5 name="trash-alt" size={16} color="#FF5252" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F8' },
  header: {
    backgroundColor: '#5EBFA4',
    height: 110,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 35,
  },
  backArrow: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  list: { padding: 16, paddingBottom: 80 },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 40,
    elevation: 2,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 6 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardContent: { flex: 1, flexDirection: 'row' },
  petInfo: { flex: 1, borderRightWidth: 1, borderRightColor: '#EEE', paddingRight: 10 },
  petName: { fontSize: 15, fontWeight: 'bold', color: '#222' },
  ownerName: { fontSize: 11, color: '#777', marginTop: 2 },
  vaccineDetails: { flex: 1.2, paddingLeft: 12 },
  vaccineName: { fontSize: 14, fontWeight: 'bold', color: '#5EBFA4' },
  recordDate: { fontSize: 11, color: '#888', marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 6 },
  badgeDone: { backgroundColor: '#E8F5E9' },
  badgeListed: { backgroundColor: '#E3F2FD' },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#555' },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});
