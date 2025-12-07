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
import { CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAuthToken } from "../api/client";

export default function ProfileDetailsScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoadingUser(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
        return;
      }

      setAuthToken(token);

      const res = await api.get("/me");
      const u = res.data?.user || res.data;

      setUser(u);
      await AsyncStorage.setItem("authUser", JSON.stringify(u));
    } catch (error) {
      console.log("Profile /me error:", error?.response?.data || error.message);

      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("authUser");
        setAuthToken(null);
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
      } else {
        Alert.alert("Error", "Could not load your profile.");
      }
    } finally {
      setLoadingUser(false);
    }
  };

  const logout = async () => {
    try {
      setLoggingOut(true);

      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        setAuthToken(token);
        try {
          await api.post("/logout");
        } catch (e) {
          console.log("Logout API error:", e?.response?.data || e.message);
        }
      }

      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("authUser");
      await AsyncStorage.removeItem("adminToken");
      await AsyncStorage.removeItem("adminUser");
      setAuthToken(null);

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Login" }],
        })
      );
    } finally {
      setLoggingOut(false);
    }
  };

  const fullName = user?.name || "—";
  const email = user?.email || "—";
  const phone = user?.phone_number || "—";
  const dob = user?.dob || "—";
  const userId = user?.id ? `User ID • ${user.id}` : "User ID • —";

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      {/* PROFILE ICON */}
      <View style={styles.center}>
        <View style={styles.avatarLarge}>
          {fullName !== "—" && (
            <Text style={styles.avatarInitial}>
              {fullName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.id}>{userId}</Text>
      </View>

      {loadingUser ? (
        <View style={{ marginTop: 20, alignItems: "center" }}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <>
          {/* PERSONAL INFO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {renderItem("Full Name", fullName)}
            {renderItem("Email", email)}
            {renderItem("Phone Number", phone)}
            {renderItem("Date of Birth", dob)}
          </View>

          {/* ACCOUNT SETTINGS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            {renderTap("Edit Profile", () => navigation.navigate("EditProfile"))}
            {renderTap("Change Password", () =>
              navigation.navigate("ChangePassword")
            )}
            {renderTap("Security Settings", () =>
              Alert.alert("Coming soon", "This section is not implemented yet.")
            )}
            {renderTap("Notifications", () =>
              Alert.alert("Coming soon", "This section is not implemented yet.")
            )}
          </View>

          {/* LEGAL */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            {renderTap("Terms & Conditions")}
            {renderTap("Privacy Policy")}
          </View>
        </>
      )}

      {/* LOG OUT BUTTON */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={logout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.logoutText}>Log Out</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* COMPONENTS */
function renderItem(label, value) {
  return (
    <View style={styles.itemBox}>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.itemValue}>{value}</Text>
    </View>
  );
}

function renderTap(label, onPress) {
  return (
    <TouchableOpacity
      style={styles.tapBox}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.tapText}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#777" />
    </TouchableOpacity>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0F", padding: 20 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "700", marginLeft: 10 },

  center: { alignItems: "center", marginBottom: 25 },

  avatarLarge: {
    width: 90,
    height: 90,
    backgroundColor: "#333",
    borderRadius: 50,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarInitial: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
  },

  name: { color: "#fff", fontSize: 22, fontWeight: "700" },
  id: { color: "#888", fontSize: 14, marginTop: 4 },

  section: { marginBottom: 25 },
  sectionTitle: { color: "#bbb", fontSize: 16, fontWeight: "600", marginBottom: 10 },

  itemBox: {
    backgroundColor: "#1A1A1C",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  itemLabel: { color: "#777", fontSize: 12 },
  itemValue: { color: "#fff", fontSize: 16, marginTop: 3 },

  tapBox: {
    backgroundColor: "#1A1A1C",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  tapText: { color: "#fff", fontSize: 16 },

  logoutBtn: {
    backgroundColor: "#FF4A4A",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  logoutText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
