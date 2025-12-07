import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAuthToken } from "../api/client";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // field-level errors
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async () => {
    // Clear previous errors
    setErrors({ email: "", password: "" });

    // Local validation
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

      const response = await api.post("/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("authUser", JSON.stringify(user));

      setAuthToken(token);

      // Navigate to Wallet and reset stack
      navigation.reset({
        index: 0,
        routes: [{ name: "Wallet" }],
      });
    } catch (error) {
      console.log("Login error:", error?.response?.data || error.message);

      const backendErrors = error?.response?.data?.errors;
      const msg =
        error?.response?.data?.message ||
        "Incorrect email or password.";

      // If Laravel returns validation errors for fields
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

      // If it's a credential issue (401, "invalid", etc.) → mark both fields red
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
      Alert.alert("Login Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.wrapper}>
        {/* HEADER */}
        <Text style={styles.appTitle}>Sign In</Text>
        <Text style={styles.subtitle}>Access your account</Text>

        {/* EMAIL */}
        <View style={styles.section}>
          <Text style={styles.label}>Email</Text>

          <View
            style={[
              styles.inputBox,
              errors.email && styles.inputErrorBox,
            ]}
          >
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#777"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: "" }));
                }
              }}
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
              placeholder="Enter your password"
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

        {/* LOGIN BUTTON */}
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>Log In</Text>
          )}
        </TouchableOpacity>

        {/* SIGN UP REDIRECT */}
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.switchText}>
            New to the app?{" "}
            <Text style={styles.highlight}>Create Account</Text>
          </Text>
        </TouchableOpacity>

        {/* ADMIN ACCESS */}
        <TouchableOpacity
          style={styles.adminBtn}
          onPress={() => navigation.navigate("AdminLogin")}
        >
          <Text style={styles.adminText}>Admin Access</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0F",
  },
  wrapper: {
    paddingHorizontal: 22,
    paddingTop: 90,
  },
  appTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#888",
    fontSize: 15,
    marginBottom: 40,
  },
  section: { marginBottom: 22 },
  label: {
    color: "#CFCFCF",
    fontSize: 15,
    marginBottom: 8,
  },

  /* INPUT STYLING */
  inputBox: {
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  inputErrorBox: {
    borderColor: "#FF4A4A",
  },
  input: {
    color: "#fff",
    fontSize: 16,
  },
  errorText: {
    color: "#FF4A4A",
    fontSize: 12,
    marginTop: 5,
  },

  /* BUTTONS */
  loginBtn: {
    backgroundColor: "#2F80ED",
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#2F80ED",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  switchText: {
    color: "#bbb",
    textAlign: "center",
    fontSize: 14,
    marginTop: 25,
    marginBottom: 10,
  },
  highlight: {
    color: "#2F80ED",
    fontWeight: "700",
  },
  adminBtn: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#2F80ED",
    backgroundColor: "rgba(47,128,237,0.08)",
    alignItems: "center",
  },
  adminText: {
    color: "#2F80ED",
    fontSize: 16,
    fontWeight: "600",
  },
});
