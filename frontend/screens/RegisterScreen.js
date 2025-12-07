// screens/RegisterScreen.js
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

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);

  // field-level errors
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone_number: "",
    dob: "",
  });

  const handleRegister = async () => {
    // Reset previous errors
    setErrors({
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      phone_number: "",
      dob: "",
    });

    let valid = true;

    if (!name) {
      setErrors((e) => ({ ...e, name: "Name is required." }));
      valid = false;
    }
    if (!email) {
      setErrors((e) => ({ ...e, email: "Email is required." }));
      valid = false;
    }
    if (!password) {
      setErrors((e) => ({ ...e, password: "Password is required." }));
      valid = false;
    }
    if (!passwordConfirmation) {
      setErrors((e) => ({
        ...e,
        password_confirmation: "Please confirm your password.",
      }));
      valid = false;
    }

    if (password && passwordConfirmation && password !== passwordConfirmation) {
      setErrors((e) => ({
        ...e,
        password_confirmation: "Passwords do not match.",
      }));
      valid = false;
    }

    if (!valid) return;

    try {
      setLoading(true);

      const response = await api.post("/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        phone_number: phoneNumber || null,
        dob: dob || null,
      });

      const { token, user } = response.data;

      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("authUser", JSON.stringify(user));

      setAuthToken(token);

      navigation.reset({
        index: 0,
        routes: [{ name: "Wallet" }],
      });
    } catch (error) {
      console.log("Register error:", error?.response?.data || error.message);

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
        "Registration failed. Please try again.";

      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* BACK BUTTON */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Login")}
        style={styles.backBtn}
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.wrapper}>
        <Text style={styles.appTitle}>Create Account</Text>
        <Text style={styles.subtitle}>Join the app</Text>

        {/* NAME */}
        <View style={styles.section}>
          <Text style={styles.label}>Full Name</Text>
          <View
            style={[
              styles.inputBox,
              errors.name && styles.inputErrorBox,
            ]}
          >
            <TextInput
              placeholder="Enter your name"
              placeholderTextColor="#777"
              style={styles.input}
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (errors.name) setErrors((e) => ({ ...e, name: "" }));
              }}
            />
          </View>
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
        </View>

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
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((e) => ({ ...e, email: "" }));
              }}
            />
          </View>
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}
        </View>

        {/* PHONE NUMBER */}
        <View style={styles.section}>
          <Text style={styles.label}>Phone Number (optional)</Text>
          <View
            style={[
              styles.inputBox,
              errors.phone_number && styles.inputErrorBox,
            ]}
          >
            <TextInput
              placeholder="Enter your phone number"
              placeholderTextColor="#777"
              style={styles.input}
              value={phoneNumber}
              onChangeText={(t) => {
                setPhoneNumber(t);
                if (errors.phone_number)
                  setErrors((e) => ({ ...e, phone_number: "" }));
              }}
            />
          </View>
          {errors.phone_number ? (
            <Text style={styles.errorText}>{errors.phone_number}</Text>
          ) : null}
        </View>

        {/* DOB */}
        <View style={styles.section}>
          <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
          <View
            style={[
              styles.inputBox,
              errors.dob && styles.inputErrorBox,
            ]}
          >
            <TextInput
              placeholder="1990-12-31"
              placeholderTextColor="#777"
              style={styles.input}
              value={dob}
              onChangeText={(t) => {
                setDob(t);
                if (errors.dob) setErrors((e) => ({ ...e, dob: "" }));
              }}
            />
          </View>
          {errors.dob ? (
            <Text style={styles.errorText}>{errors.dob}</Text>
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
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: "" }));
              }}
            />
          </View>
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}
        </View>

        {/* CONFIRM PASSWORD */}
        <View style={styles.section}>
          <Text style={styles.label}>Confirm Password</Text>
          <View
            style={[
              styles.inputBox,
              errors.password_confirmation && styles.inputErrorBox,
            ]}
          >
            <TextInput
              placeholder="Confirm your password"
              placeholderTextColor="#777"
              secureTextEntry
              style={styles.input}
              value={passwordConfirmation}
              onChangeText={(t) => {
                setPasswordConfirmation(t);
                if (errors.password_confirmation)
                  setErrors((e) => ({ ...e, password_confirmation: "" }));
              }}
            />
          </View>
          {errors.password_confirmation ? (
            <Text style={styles.errorText}>
              {errors.password_confirmation}
            </Text>
          ) : null}
        </View>

        {/* REGISTER BTN */}
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* LOGIN REDIRECT */}
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.switchText}>
            Already have an account?{" "}
            <Text style={styles.highlight}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0F" },
  wrapper: { paddingHorizontal: 22, paddingTop: 30 },

  backBtn: { marginTop: 40, marginLeft: 10 },
  backText: {
    color: "#2F80ED",
    fontSize: 16,
    fontWeight: "600",
  },

  appTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: { color: "#888", fontSize: 15, marginBottom: 40 },

  section: { marginBottom: 22 },
  label: { color: "#CFCFCF", fontSize: 15, marginBottom: 8 },

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

  input: { color: "#fff", fontSize: 16 },

  errorText: {
    color: "#FF4A4A",
    fontSize: 12,
    marginTop: 6,
  },

  registerBtn: {
    backgroundColor: "#2F80ED",
    paddingVertical: 16,
    borderRadius: 40,
    alignItems: "center",
    marginTop: 10,
  },
  registerText: { color: "#fff", fontSize: 18, fontWeight: "600" },

  switchText: {
    color: "#bbb",
    textAlign: "center",
    fontSize: 14,
    marginTop: 25,
    marginBottom: 10,
  },
  highlight: { color: "#2F80ED", fontWeight: "700" },
});
