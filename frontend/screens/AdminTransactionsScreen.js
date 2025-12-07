import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAuthToken } from "../api/client";

export default function AdminTransactionsScreen({ navigation }) {
  const [range, setRange] = useState("Day"); // UI only for now
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("adminToken");
      if (!token) {
        Alert.alert("Session expired", "Please login again as admin.");
        navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
        return;
      }

      setAuthToken(token);

      // 🔐 GET /api/admin/transactions
      const res = await api.get("/admin/transactions");
      console.log("ADMIN TX RESPONSE:", res.data); // debug in Metro

      const data = res.data;
      const list = data?.transactions || data || [];

      setTransactions(Array.isArray(list) ? list : []);
    } catch (error) {
      console.log(
        "Admin transactions error:",
        error?.response?.data || error.message
      );

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        Alert.alert("Unauthorized", "Your admin session is invalid or expired.");
        await AsyncStorage.removeItem("adminToken");
        await AsyncStorage.removeItem("adminUser");
        setAuthToken(null);
        navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      } else {
        Alert.alert("Error", "Could not load transactions. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (t) => {
    if (!t) return "Transaction";
    const type = t.toLowerCase();
    if (type === "deposit") return "Top-Up";
    if (type === "withdraw") return "Withdraw";
    if (type === "transfer") return "Transfer";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getStatusNormalized = (s) => (s || "").toLowerCase();

  // basic range filter on created_at (Day / Month / Year)
  const inRange = (tx) => {
    if (!tx.created_at) return true;
    const created = new Date(tx.created_at);
    if (isNaN(created.getTime())) return true;

    const now = new Date();
    if (range === "Day") {
      const diffMs = now - created;
      return diffMs <= 24 * 60 * 60 * 1000;
    }
    if (range === "Month") {
      const diffMs = now - created;
      return diffMs <= 30 * 24 * 60 * 60 * 1000;
    }
    if (range === "Year") {
      const diffMs = now - created;
      return diffMs <= 365 * 24 * 60 * 60 * 1000;
    }
    return true;
  };

  const filteredTx = transactions.filter((t) => {
    const typeOk =
      typeFilter === "All" ? true : getTypeLabel(t.type) === typeFilter;
    const statusNorm = getStatusNormalized(t.status);
    const statusOk =
      statusFilter === "All"
        ? true
        : statusNorm === statusFilter.toLowerCase();

    return typeOk && statusOk && inRange(t);
  });

  const totalVolume = transactions.reduce((sum, t) => {
    const amt = Number(t.amount || 0);
    if (isNaN(amt)) return sum;
    return sum + amt;
  }, 0);

  const failedCount = transactions.filter(
    (t) => getStatusNormalized(t.status) === "failed"
  ).length;

  const formatDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const getNames = (tx) => {
    const fromName =
      tx.from_user?.name ||
      tx.fromUser?.name ||
      (tx.from_user_id ? `User #${tx.from_user_id}` : "System");
    const toName =
      tx.to_user?.name ||
      tx.toUser?.name ||
      (tx.to_user_id ? `User #${tx.to_user_id}` : "Wallet");
    return { fromName, toName };
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
      </View>

      {/* RANGE FILTER TABS */}
      <View style={styles.rangeRow}>
        {["Day", "Month", "Year"].map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.rangeChip,
              range === r && styles.rangeChipActive,
            ]}
            onPress={() => setRange(r)}
          >
            <Text
              style={[
                styles.rangeText,
                range === r && styles.rangeTextActive,
              ]}
            >
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Transactions</Text>
          <Text style={styles.statValue}>{transactions.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Volume</Text>
          <Text style={styles.statValue}>
            ${totalVolume.toLocaleString()}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Failed</Text>
          <Text style={styles.statValue}>{failedCount}</Text>
        </View>
      </View>

      {/* TYPE & STATUS FILTERS */}
      <Text style={styles.filterLabel}>Filter by type</Text>
      <View style={styles.filterRow}>
        {["All", "Send", "Top-Up", "Withdraw", "Transfer"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.filterChip,
              typeFilter === t && styles.filterChipActive,
            ]}
            onPress={() => setTypeFilter(t)}
          >
            <Text
              style={[
                styles.filterText,
                typeFilter === t && styles.filterTextActive,
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.filterLabel}>Filter by status</Text>
      <View style={styles.filterRow}>
        {["All", "Completed", "Pending", "Failed"].map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.filterChip,
              statusFilter === s && styles.filterChipActive,
            ]}
            onPress={() => setStatusFilter(s)}
          >
            <Text
              style={[
                styles.filterText,
                statusFilter === s && styles.filterTextActive,
              ]}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LIST */}
      <View style={{ marginTop: 10 }}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : filteredTx.length === 0 ? (
          <Text style={styles.emptyText}>
            No transactions match your filters.
          </Text>
        ) : (
          filteredTx.map((t) => {
            const typeLabel = getTypeLabel(t.type);
            const { fromName, toName } = getNames(t);
            const dateStr = formatDate(t.created_at);
            const amt = Number(t.amount || 0);
            const statusNorm = getStatusNormalized(t.status);

            let statusStyle = styles.statusCompleted;
            if (statusNorm === "pending") statusStyle = styles.statusPending;
            if (statusNorm === "failed") statusStyle = styles.statusFailed;

            return (
              <View key={t.id} style={styles.txRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txId}>{`TX-${t.id}`}</Text>
                  <Text style={styles.txLine}>
                    {typeLabel} · {fromName} → {toName}
                  </Text>
                  <Text style={styles.txDate}>{dateStr}</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.txAmount}>
                    ${amt.toFixed(2)}
                  </Text>
                  <View style={[styles.statusBadge, statusStyle]}>
                    <Text style={styles.statusText}>
                      {statusNorm
                        ? statusNorm.charAt(0).toUpperCase() +
                          statusNorm.slice(1)
                        : "Unknown"}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050509", padding: 20 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 8,
  },

  rangeRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  rangeChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#131318",
    marginRight: 8,
  },
  rangeChipActive: { backgroundColor: "#2563EB" },
  rangeText: { color: "#aaa", fontSize: 13 },
  rangeTextActive: { color: "#fff", fontWeight: "600" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#131318",
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statLabel: { color: "#999", fontSize: 12 },
  statValue: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4 },

  filterLabel: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 6,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#333",
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  filterText: { color: "#aaa", fontSize: 12 },
  filterTextActive: { color: "#fff", fontWeight: "600" },

  txRow: {
    backgroundColor: "#131318",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  txId: { color: "#fff", fontSize: 13, fontWeight: "600" },
  txLine: { color: "#aaa", fontSize: 12 },
  txDate: { color: "#777", fontSize: 11, marginTop: 2 },
  txAmount: { color: "#fff", fontSize: 15, fontWeight: "700", marginBottom: 4 },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusCompleted: { backgroundColor: "#16A34A33" },
  statusPending: { backgroundColor: "#F59E0B33" },
  statusFailed: { backgroundColor: "#DC262633" },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 20,
    fontSize: 13,
  },
});
