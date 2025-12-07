import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAuthToken } from "../api/client";

const screenWidth = Dimensions.get("window").width;

// Dummy chart data per range (we keep this for now)
const CHART_DATA = {
  day: {
    labels: ["0h", "4h", "8h", "12h", "16h", "20h"],
    values: [30, 55, 80, 70, 110, 95],
  },
  month: {
    labels: ["1", "5", "10", "15", "20", "25", "30"],
    values: [400, 900, 700, 1200, 1500, 1400, 1800],
  },
  year: {
    labels: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"],
    values: [8000, 13000, 15000, 20000, 25000, 30000],
  },
};

export default function AdminDashboardScreen({ navigation }) {
  const [range, setRange] = useState("month"); // "day" | "month" | "year"
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    tx: 0,
    volume: 0,
  });

  const currentChart = CHART_DATA[range];

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("adminToken");
      if (!token) {
        Alert.alert("Session expired", "Please login again as admin.");
        navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
        return;
      }

      setAuthToken(token);

      // 🔐 ADMIN ONLY: GET /api/admin/transactions
      const res = await api.get("/admin/transactions");
      const data = res.data;
      const transactions = data?.transactions || data || [];

      const txCount = transactions.length;

      let volume = 0;
      const userIds = new Set();

      transactions.forEach((tx) => {
        const amt = Number(tx.amount || 0);
        if (!isNaN(amt)) {
          volume += amt;
        }
        if (tx.from_user_id) userIds.add(tx.from_user_id);
        if (tx.to_user_id) userIds.add(tx.to_user_id);
      });

      setStats({
        users: userIds.size,
        tx: txCount,
        volume,
      });
    } catch (error) {
      console.log(
        "Admin dashboard error:",
        error?.response?.data || error.message
      );

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        Alert.alert("Unauthorized", "Your admin session is invalid or expired.");
        await AsyncStorage.removeItem("adminToken");
        await AsyncStorage.removeItem("adminUser");
        setAuthToken(null);
        navigation.reset({ index: 0, routes: [{ name: "AdminLogin" }] });
      } else {
        Alert.alert(
          "Error",
          "Could not load admin dashboard data. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem("adminToken");
    await AsyncStorage.removeItem("adminUser");
    setAuthToken(null);
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>System overview & analytics</Text>

      {loading && (
        <View style={{ marginBottom: 15 }}>
          <ActivityIndicator color="#fff" />
        </View>
      )}

      {/* TIME RANGE FILTER */}
      <View style={styles.filterRow}>
        {renderFilterButton("Day", "day", range, setRange)}
        {renderFilterButton("Month", "month", range, setRange)}
        {renderFilterButton("Year", "year", range, setRange)}
      </View>

      {/* STATS CARDS */}
      <View style={styles.row}>
        {renderStatCard(
          "Active Users (seen in tx)",
          "users",
          stats.users.toString()
        )}
        {renderStatCard("Transactions", "repeat", stats.tx.toString())}
      </View>

      <View style={styles.row}>
        {renderStatCard(
          "Total Volume",
          "trending-up",
          `$${stats.volume.toFixed(2)}`
        )}
      </View>

      {/* ANALYTICS CHART */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Activity Analytics</Text>
        <Text style={styles.chartSubtitle}>
          {range === "day" && "Transactions over the last 24 hours"}
          {range === "month" && "Transactions over the last 30 days"}
          {range === "year" && "Monthly volume over the last year"}
        </Text>

        <LineChart
          data={{
            labels: currentChart.labels,
            datasets: [{ data: currentChart.values }],
          }}
          width={screenWidth - 40}
          height={220}
          bezier
          style={styles.chart}
          chartConfig={{
            backgroundColor: "#111216",
            backgroundGradientFrom: "#111216",
            backgroundGradientTo: "#111216",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(47, 128, 237, ${opacity})`,
            labelColor: () => "#888",
            propsForDots: {
              r: "4",
            },
          }}
        />
      </View>

      {/* MANAGEMENT SECTION */}
      <Text style={styles.sectionTitle}>Management</Text>

      <TouchableOpacity
        style={styles.navBtn}
        onPress={() => navigation.navigate("AdminUsers")}
      >
        <Feather name="users" size={22} color="#fff" />
        <View style={styles.navTextBox}>
          <Text style={styles.navText}>See Users</Text>
          <Text style={styles.navSubText}>
            Browse, search and inspect all user accounts.
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navBtn}
        onPress={() => navigation.navigate("AdminTransactions")}
      >
        <Feather name="repeat" size={22} color="#fff" />
        <View style={styles.navTextBox}>
          <Text style={styles.navText}>View Transactions</Text>
          <Text style={styles.navSubText}>
            Monitor transfers, status and risk activity.
          </Text>
        </View>
      </TouchableOpacity>

      {/* LOGOUT */}
      <TouchableOpacity
        style={[styles.navBtn, styles.logoutBtn]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={22} color="#fff" />
        <Text style={styles.navText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* FILTER BUTTON */
function renderFilterButton(label, value, activeValue, setActive) {
  const isActive = value === activeValue;
  return (
    <TouchableOpacity
      style={[styles.filterBtn, isActive && styles.filterBtnActive]}
      onPress={() => setActive(value)}
    >
      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* STAT CARD */
function renderStatCard(title, icon, number) {
  return (
    <View style={styles.card}>
      <Feather name={icon} size={28} color="#2F80ED" />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardNumber}>{number}</Text>
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050608",
    padding: 20,
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 20,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 15,
    marginBottom: 25,
  },

  /* FILTER */
  filterRow: {
    flexDirection: "row",
    backgroundColor: "#111216",
    borderRadius: 999,
    padding: 4,
    marginBottom: 25,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: "#2F80ED",
  },
  filterText: {
    color: "#777",
    fontSize: 13,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
  },

  /* STATS */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  card: {
    flex: 1,
    backgroundColor: "#111216",
    padding: 18,
    borderRadius: 16,
    marginRight: 10,
  },
  cardTitle: {
    color: "#bbb",
    fontSize: 14,
    marginTop: 10,
  },
  cardNumber: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 6,
  },

  /* CHART */
  chartContainer: {
    backgroundColor: "#111216",
    padding: 18,
    borderRadius: 16,
    marginBottom: 22,
    marginTop: 4,
  },
  chartTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  chartSubtitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },
  chart: {
    marginTop: 12,
    borderRadius: 16,
  },

  /* MANAGEMENT */
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 10,
  },

  navBtn: {
    backgroundColor: "#111216",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },

  navTextBox: {
    marginLeft: 12,
    flex: 1,
  },

  navText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  navSubText: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },

  logoutBtn: {
    marginTop: 24,
    backgroundColor: "#8B0000",
  },
});
