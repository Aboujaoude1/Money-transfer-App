import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAuthToken } from "../api/client";

export default function AdminUsersScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("adminToken");
      if (!token) {
        Alert.alert("Session expired", "Please login again as admin.");
        navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
        return;
      }

      setAuthToken(token);

      const res = await api.get("/admin/users");
      console.log("ADMIN USERS RESPONSE:", res.data); // 👈 debug
      const data = res.data;
      const list = data?.users || data || [];

      setUsers(Array.isArray(list) ? list : []);
    } catch (error) {
      console.log(
        "Admin users error:",
        error?.response?.data || error.message
      );

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        Alert.alert("Unauthorized", "Your admin session is invalid or expired.");
        await AsyncStorage.removeItem("adminToken");
        await AsyncStorage.removeItem("adminUser");
        setAuthToken(null);
        navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      } else {
        Alert.alert("Error", "Could not load users. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // derive stats from real users
  const totalUsers = users.length;

  const withStatus = users.map((u) => ({
    ...u,
    _status: u.status || "Active", // fallback if no status column
  }));

  const activeUsers = withStatus.filter((u) => u._status === "Active").length;
  const suspendedUsers = withStatus.filter(
    (u) => u._status === "Suspended"
  ).length;

  const filteredUsers = withStatus.filter((u) => {
    const phone = u.phone_number || u.phone || "";
    const status = u._status || "Active";

    const matchesSearch =
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      phone.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All"
        ? true
        : status.toLowerCase() === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Users</Text>
      </View>

      {/* STATS CARDS */}
      {loading ? (
        <View style={{ marginVertical: 16, alignItems: "center" }}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statValue}>{totalUsers}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Active</Text>
            <Text style={styles.statValue}>{activeUsers}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Suspended</Text>
            <Text style={styles.statValue}>{suspendedUsers}</Text>
          </View>
        </View>
      )}

      {/* SEARCH BAR */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, phone..."
          placeholderTextColor="#777"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* FILTERS */}
      <View style={styles.filterRow}>
        {["All", "Active", "Suspended", "Pending"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              filter === f && styles.filterChipActive,
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* USER LIST */}
      <View style={styles.list}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : filteredUsers.length === 0 ? (
          <Text style={styles.emptyText}>No users match your filters.</Text>
        ) : (
          filteredUsers.map((u) => {
            const phone = u.phone_number || u.phone || "—";
            const joined = u.joined || u.created_at || "—";
            const status = u._status || "Active";
            const balance = Number(u.balance ?? u.wallet?.balance ?? 0);

            return (
              <TouchableOpacity
                key={u.id}
                style={styles.userRow}
                onPress={() =>
                  navigation.navigate("AdminUserDetails", {
                    user: {
                      ...u,
                      phone,
                      joined,
                      status,
                      balance,
                    },
                  })
                }
              >
                <View style={styles.userLeft}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {(u.name || "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  <View>
                    <Text style={styles.userName}>{u.name}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                    <Text style={styles.userPhone}>{phone}</Text>
                    <Text style={styles.userJoined}>Joined: {joined}</Text>
                    <Text style={styles.userBalance}>
                      Balance: ${balance.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    status === "Active"
                      ? styles.statusActive
                      : styles.statusSuspended,
                  ]}
                >
                  <Text style={styles.statusText}>{status}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050509", padding: 20 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 8,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#131318",
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  statLabel: { color: "#999", fontSize: 12 },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "700", marginTop: 4 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131318",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#22232b",
  },
  searchInput: { color: "#fff", marginLeft: 8, flex: 1, fontSize: 14 },

  filterRow: {
    flexDirection: "row",
    marginBottom: 10,
    flexWrap: "wrap",
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

  list: { marginTop: 8 },

  userRow: {
    backgroundColor: "#131318",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  userLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1 },

  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2563EB33",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  userAvatarText: { color: "#fff", fontWeight: "700" },

  userName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  userEmail: { color: "#aaa", fontSize: 12 },
  userPhone: { color: "#888", fontSize: 12 },
  userJoined: { color: "#666", fontSize: 11, marginTop: 2 },
  userBalance: { color: "#fff", fontSize: 13, marginTop: 2 },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusActive: { backgroundColor: "#16A34A33" },
  statusSuspended: { backgroundColor: "#DC262633" },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600" },

  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 20,
    fontSize: 13,
  },
});
