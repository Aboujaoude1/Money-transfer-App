import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAuthToken } from "../api/client";

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // field-level errors
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleAdminLogin = async () => {
    // clear previous errors
    setErrors({ email: "", password: "" });

    // local validation
    let valid = true;

    if (!email) {
      valid = false;
      setErrors((prev) => ({ ...prev, email: "Email is required." }));
    }

    if (!password) {
      valid = false;
      setErrors((prev) => ({ ...prev, password: "Password is required." }));
    }

    if (!valid) return;

    try {
      setLoading(true);

      const res = await api.post("/login", {
        email,
        password,
      });

      const { token, user } = res.data;

      // Check role
      if (!user || user.role !== "admin") {
        // mark both fields as unauthorized
        setErrors({
          email: "This account is not authorized as admin.",
          password: "This account is not authorized as admin.",
        });
        return;
      }

      // Save separately so you can distinguish from normal user auth if needed
      await AsyncStorage.setItem("adminToken", token);
      await AsyncStorage.setItem("adminUser", JSON.stringify(user));

      // Use this token for admin API calls
      setAuthToken(token);

      navigation.reset({
        index: 0,
        routes: [{ name: "AdminDashboard" }],
      });
    } catch (error) {
      console.log("Admin login error:", error?.response?.data || error.message);

      const backendErrors = error?.response?.data?.errors;
      const msg =
        error?.response?.data?.message ||
        "Admin login failed. Please check your credentials.";

      // Laravel validation errors for fields
      if (backendErrors) {
        const newErrors = {};

        if (backendErrors.email) {
          newErrors.email = backendErrors.email[0];
        }
        if (backendErrors.password) {
          newErrors.password = backendErrors.password[0];
        }

        setErrors((prev) => ({ ...prev, ...newErrors }));
        return;
      }

      // Wrong credentials → mark both fields red
      if (
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("incorrect") ||
        error?.response?.status === 401
      ) {
        setErrors({
          email: "Incorrect email or password.",
          password: "Incorrect email or password.",
        });
        return;
      }

      // Fallback generic error
      Alert.alert("Login error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* BACK BUTTON */}
<TouchableOpacity
  onPress={() => navigation.navigate("Login")}
  style={styles.backBtn}
>
  <Text style={styles.backText}>← Back</Text>
</TouchableOpacity>

      <Text style={styles.title}>Admin Access</Text>
      <Text style={styles.subtitle}>System Control Panel</Text>

      {/* EMAIL */}
      <View style={styles.section}>
        <Text style={styles.label}>Admin Email</Text>
        <View
          style={[
            styles.inputBox,
            errors.email && styles.inputErrorBox,
          ]}
        >
          <TextInput
            placeholder="Enter your admin email"
            placeholderTextColor="#777"
            style={styles.input}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) {
                setErrors((prev) => ({ ...prev, email: "" }));
              }
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        {errors.email ? (
          <Text style={styles.errorText}>{errors.email}</Text>
        ) : null}
      </View>

      {/* PASSWORD */}
      <View style={styles.section}>
        <Text style={styles.label}>Password</Text>
        <View
          style={[
            styles.inputBox,
            errors.password && styles.inputErrorBox,
          ]}
        >
          <TextInput
            placeholder="Enter your admin password"
            placeholderTextColor="#777"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: "" }));
              }
            }}
          />
        </View>
        {errors.password ? (
          <Text style={styles.errorText}>{errors.password}</Text>
        ) : null}
      </View>

      {/* LOGIN */}
      <TouchableOpacity
        style={[styles.loginBtn, loading && { opacity: 0.7 }]}
        onPress={handleAdminLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0F", padding: 20 },

  title: { fontSize: 32, color: "#fff", fontWeight: "700", marginTop: 60 },
  subtitle: { color: "#aaa", fontSize: 16, marginBottom: 30 },

  section: { marginBottom: 20 },
  label: { color: "#bbb", marginBottom: 8 },

  inputBox: {
    backgroundColor: "#1A1A1C",
    padding: 15,
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

  loginBtn: {
    backgroundColor: "#2F80ED",
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
    marginTop: 10,
  },
  loginText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  backBtn: {
  marginTop: 20,
  marginBottom: 20,
},

backText: {
  color: "#2F80ED",
  fontSize: 16,
  fontWeight: "600",
},

});
