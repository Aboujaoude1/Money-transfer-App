import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AdminUserDetailsScreen({ route, navigation }) {
  const { user } = route.params;

  const name = user?.name || "Unknown User";
  const email = user?.email || "—";
  const phone = user?.phone || user?.phone_number || "—";
  const joined = user?.joined || user?.created_at || "—";
  const status = user?.status || "Active";

  const handleSuspendToggle = () => {
    // TODO: Wire to real admin API when you add it in Laravel
    // e.g. PATCH /api/admin/users/{id}/suspend or similar
    Alert.alert(
      "Not implemented",
      `Here you will ${
        status === "Active" ? "suspend" : "activate"
      } this user via an admin API.`
    );
  };

  const handleDelete = () => {
    // TODO: Wire to real admin API when you add it in Laravel
    // e.g. DELETE /api/admin/users/{id}
    Alert.alert(
      "Not implemented",
      "Here you will delete this user via an admin API."
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Details</Text>
      </View>

      {/* USER CARD */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{name}</Text>

        {/* STATUS */}
        <Text
          style={[
            styles.statusBase,
            status === "Active" ? styles.statusActive : styles.statusSuspended,
          ]}
        >
          {status}
        </Text>

        <View style={styles.line} />

        {/* USER INFO */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{phone}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Joined</Text>
          <Text style={styles.infoValue}>{joined}</Text>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.suspendBtn} onPress={handleSuspendToggle}>
          <Text style={styles.suspendText}>
            {status === "Active" ? "Suspend User" : "Activate User"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete User</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 50 }} />
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

  card: {
    backgroundColor: "#131318",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#2563EB33",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  avatarText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },

  name: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },

  statusBase: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  statusActive: {
    color: "#16A34A",
  },
  statusSuspended: {
    color: "#DC2626",
  },

  line: {
    height: 1,
    width: "100%",
    backgroundColor: "#2a2a2f",
    marginVertical: 20,
  },

  infoRow: {
    width: "100%",
    marginBottom: 14,
  },

  infoLabel: {
    color: "#888",
    fontSize: 13,
  },

  infoValue: {
    color: "#fff",
    fontSize: 15,
    marginTop: 2,
  },

  actions: { marginTop: 25 },

  suspendBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  suspendText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  deleteBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
