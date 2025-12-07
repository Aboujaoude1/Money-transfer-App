import React, { useState } from "react";
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

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const handleChangePassword = async () => {
    setErrors({
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    });

    let valid = true;

    if (!currentPassword) {
      valid = false;
      setErrors((e) => ({
        ...e,
        current_password: "Current password is required.",
      }));
    }

    if (!newPassword) {
      valid = false;
      setErrors((e) => ({
        ...e,
        new_password: "New password is required.",
      }));
    } else if (newPassword.length < 6) {
      valid = false;
      setErrors((e) => ({
        ...e,
        new_password: "New password must be at least 6 characters.",
      }));
    }

    if (!confirmPassword) {
      valid = false;
      setErrors((e) => ({
        ...e,
        new_password_confirmation: "Please confirm your new password.",
      }));
    } else if (newPassword && confirmPassword !== newPassword) {
      valid = false;
      setErrors((e) => ({
        ...e,
        new_password_confirmation: "Passwords do not match.",
      }));
    }

    if (!valid) return;

    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      setAuthToken(token);

      // 🔐 Adjust endpoint/field names to match your Laravel API
      const res = await api.post("/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      console.log("Change password response:", res.data);

      Alert.alert("Success", "Password updated successfully.");
      navigation.goBack();
    } catch (error) {
      console.log(
        "Change password error:",
        error?.response?.data || error.message
      );

      const backendErrors = error?.response?.data?.errors;
      if (backendErrors) {
        const newErrors = {};
        Object.keys(backendErrors).forEach((field) => {
          newErrors[field] = backendErrors[field][0];
        });
        setErrors((prev) => ({ ...prev, ...newErrors }));
        return;
      }

      const msg =
        error?.response?.data?.message ||
        "Could not update password. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

      <View style={styles.wrapper}>
        {/* CURRENT PASSWORD */}
        <View style={styles.section}>
          <Text style={styles.label}>Current Password</Text>
          <View
            style={[
              styles.inputBox,
              errors.current_password && styles.inputErrorBox,
            ]}
          >
            <TextInput
              placeholder="Enter current password"
              placeholderTextColor="#777"
              secureTextEntry
              style={styles.input}
              value={currentPassword}
              onChangeText={(t) => {
                setCurrentPassword(t);
                if (errors.current_password)
                  setErrors((e) => ({ ...e, current_password: "" }));
              }}
            />
          </View>
          {errors.current_password ? (
            <Text style={styles.errorText}>{errors.current_password}</Text>
          ) : null}
        </View>

        {/* NEW PASSWORD */}
        <View style={styles.section}>
          <Text style={styles.label}>New Password</Text>
          <View
            style={[
              styles.inputBox,
              errors.new_password && styles.inputErrorBox,
            ]}
          >
            <TextInput
              placeholder="Enter new password"
              placeholderTextColor="#777"
              secureTextEntry
              style={styles.input}
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                if (errors.new_password)
                  setErrors((e) => ({ ...e, new_password: "" }));
              }}
            />
          </View>
          {errors.new_password ? (
            <Text style={styles.errorText}>{errors.new_password}</Text>
          ) : null}
        </View>

        {/* CONFIRM PASSWORD */}
        <View style={styles.section}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View
            style={[
              styles.inputBox,
              errors.new_password_confirmation && styles.inputErrorBox,
            ]}
          >
            <TextInput
              placeholder="Confirm new password"
              placeholderTextColor="#777"
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
              onChangeText={(t) => {
                setConfirmPassword(t);
                if (errors.new_password_confirmation)
                  setErrors((e) => ({
                    ...e,
                    new_password_confirmation: "",
                  }));
              }}
            />
          </View>
          {errors.new_password_confirmation ? (
            <Text style={styles.errorText}>
              {errors.new_password_confirmation}
            </Text>
          ) : null}
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleChangePassword}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>Update Password</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0F", padding: 20 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 10,
  },

  wrapper: { marginTop: 10 },

  section: { marginBottom: 22 },
  label: { color: "#CFCFCF", fontSize: 15, marginBottom: 8 },

  inputBox: {
    backgroundColor: "#1A1A1C",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  inputErrorBox: {
    borderColor: "#FF4A4A",
  },
  input: { color: "#fff", fontSize: 16 },

  errorText: {
    color: "#FF4A4A",
    fontSize: 12,
    marginTop: 5,
  },

  saveBtn: {
    backgroundColor: "#2F80ED",
    paddingVertical: 14,
    borderRadius: 40,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
