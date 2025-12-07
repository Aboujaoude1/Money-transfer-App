import React, { useEffect, useState } from "react";
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

export default function EditProfileScreen({ navigation }) {
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);

  // FORM DATA
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dob, setDob] = useState("");

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone_number: "",
    dob: "",
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoadingUser(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      setAuthToken(token);

      const res = await api.get("/me");
      const u = res.data?.user || res.data;

      setName(u?.name || "");
      setEmail(u?.email || "");
      setPhoneNumber(u?.phone_number || "");

      // 🔥 FORMAT DATE (Laravel → YYYY-MM-DD)
      if (u?.dob) {
        const formatted = u.dob.split("T")[0]; // remove time + timezone
        setDob(formatted);
      } else {
        setDob("");
      }
    } catch (error) {
      console.log("EditProfile /me error:", error?.response?.data || error.message);
      Alert.alert("Error", "Could not load your profile.");
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSave = async () => {
    // clear errors
    setErrors({
      name: "",
      email: "",
      phone_number: "",
      dob: "",
    });

    let valid = true;

    if (!name) {
      valid = false;
      setErrors((prev) => ({ ...prev, name: "Name is required." }));
    }

    if (!email) {
      valid = false;
      setErrors((prev) => ({ ...prev, email: "Email is required." }));
    }

    if (!valid) return;

    try {
      setSaving(true);

      const res = await api.put("/profile", {
        name,
        email,
        phone_number: phoneNumber || null,
        dob: dob || null, // already formatted
      });

      const updatedUser = res.data?.user || res.data;
      if (updatedUser) {
        await AsyncStorage.setItem("authUser", JSON.stringify(updatedUser));
      }

      Alert.alert("Success", "Profile updated successfully.");
      navigation.goBack();
    } catch (error) {
      console.log("Profile update error:", error?.response?.data || error.message);

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
        error?.response?.data?.message || "Could not update profile.";
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
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      {loadingUser ? (
        <View style={{ marginTop: 40, alignItems: "center" }}>
          <ActivityIndicator color="#fff" />
        </View>
      ) : (
        <View style={styles.wrapper}>
          {/* NAME */}
          <InputField
            label="Full Name"
            value={name}
            error={errors.name}
            onChange={(t) => {
              setName(t);
              if (errors.name) setErrors((e) => ({ ...e, name: "" }));
            }}
          />

          {/* EMAIL */}
          <InputField
            label="Email"
            value={email}
            error={errors.email}
            keyboardType="email-address"
            onChange={(t) => {
              setEmail(t);
              if (errors.email) setErrors((e) => ({ ...e, email: "" }));
            }}
          />

          {/* PHONE */}
          <InputField
            label="Phone Number"
            value={phoneNumber}
            error={errors.phone_number}
            onChange={(t) => {
              setPhoneNumber(t);
              if (errors.phone_number)
                setErrors((e) => ({ ...e, phone_number: "" }));
            }}
          />

          {/* DOB */}
          <InputField
            label="Date of Birth (YYYY-MM-DD)"
            value={dob}
            error={errors.dob}
            placeholder="1990-12-31"
            onChange={(t) => {
              setDob(t);
              if (errors.dob) setErrors((e) => ({ ...e, dob: "" }));
            }}
          />

          {/* SAVE BUTTON */}
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      )}
    </ScrollView>
  );
}

/* ===============================
   Reusable Input Component
=============================== */
function InputField({
  label,
  value,
  onChange,
  error,
  placeholder = "Enter value",
  keyboardType = "default",
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, error && styles.inputErrorBox]}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#777"
          style={styles.input}
          value={value}
          keyboardType={keyboardType}
          onChangeText={onChange}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/* ===============================
   STYLES
=============================== */
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
  inputErrorBox: { borderColor: "#FF4A4A" },

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
