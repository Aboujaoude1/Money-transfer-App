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
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAuthToken } from "../api/client";

export default function SendMoneyScreen({ navigation }) {
  const [amount, setAmount] = useState("");
  const [beneficiary, setBeneficiary] = useState(""); // EMAIL for backend
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  // field-level errors
  const [errors, setErrors] = useState({
    amount: "",
    beneficiary: "",
    name: "",
    reason: "",
  });

  const isDisabled = !amount || !beneficiary || !name || loading;

  const handleSend = async () => {
    // clear previous errors
    setErrors({
      amount: "",
      beneficiary: "",
      name: "",
      reason: "",
    });

    const numericAmount = parseFloat(amount);
    let hasLocalError = false;
    const newErrors = {};

    // basic client-side checks
    if (isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = "Please enter a valid amount.";
      hasLocalError = true;
    }

    if (!beneficiary || !beneficiary.includes("@")) {
      newErrors.beneficiary = "Please enter a valid email.";
      hasLocalError = true;
    }

    if (!name.trim()) {
      newErrors.name = "Please enter the beneficiary name.";
      hasLocalError = true;
    }

    if (hasLocalError) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Session expired", "Please log in again.");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      setAuthToken(token);

      // 🔐 MATCHING YOUR CONTROLLER:
      // to_email, amount, description
      const res = await api.post("/transfer", {
        to_email: beneficiary,
        amount: numericAmount,
        description: reason || null,
      });

      console.log("Send money response:", res.data);

      // Show success message
      Alert.alert("Success", "Money sent successfully.");

      // ✅ Best cross-platform way:
      // go back to Wallet / main stack after success
      navigation.reset({
        index: 0,
        routes: [{ name: "Wallet" }],
      });
    } catch (error) {
      console.log("Send money error:", error?.response?.data || error.message);

      const validationErrors = error?.response?.data?.errors;
      const newErrorsFromServer = {};

      if (validationErrors) {
        // map Laravel validation fields to our inputs
        if (validationErrors.amount) {
          newErrorsFromServer.amount = validationErrors.amount[0];
        }
        if (validationErrors.to_email) {
          newErrorsFromServer.beneficiary = validationErrors.to_email[0];
        }
        // (you can add mappings for 'description', 'name', etc. later if needed)

        setErrors((prev) => ({ ...prev, ...newErrorsFromServer }));
      }

      const msg =
        error?.response?.data?.message ||
        (validationErrors
          ? "Please fix the highlighted fields."
          : "Could not send money. Please try again.");

      // If server gave field errors, we highlight them;
      // still show a global message if none mapped
      if (!validationErrors || Object.keys(newErrorsFromServer).length === 0) {
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Send from Wallet</Text>
      </View>

      {/* Amount */}
      <View style={styles.section}>
        <Text style={styles.label}>Amount</Text>

        <View
          style={[
            styles.inputBox,
            errors.amount && styles.inputErrorBox,
          ]}
        >
          <TextInput
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              if (errors.amount) {
                setErrors((prev) => ({ ...prev, amount: "" }));
              }
            }}
            placeholder="0.00"
            placeholderTextColor="#777"
            style={styles.input}
            keyboardType="numeric"
          />
        </View>
        {errors.amount ? (
          <Text style={styles.errorText}>{errors.amount}</Text>
        ) : null}
      </View>

      {/* Beneficiary (EMAIL for backend) */}
      <View style={styles.section}>
        <Text style={styles.label}>Beneficiary Email</Text>

        <View
          style={[
            styles.inputBox,
            errors.beneficiary && styles.inputErrorBox,
          ]}
        >
          <TextInput
            value={beneficiary}
            onChangeText={(text) => {
              setBeneficiary(text);
              if (errors.beneficiary) {
                setErrors((prev) => ({ ...prev, beneficiary: "" }));
              }
            }}
            placeholder="example@domain.com"
            placeholderTextColor="#777"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Feather name="user-plus" size={22} color="#888" />
        </View>
        {errors.beneficiary ? (
          <Text style={styles.errorText}>{errors.beneficiary}</Text>
        ) : null}
      </View>

      {/* Beneficiary Name (UI only for now) */}
      <View style={styles.section}>
        <Text style={styles.label}>Beneficiary Name</Text>

        <View
          style={[
            styles.inputBox,
            errors.name && styles.inputErrorBox,
          ]}
        >
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: "" }));
              }
            }}
            placeholder="Full name"
            placeholderTextColor="#777"
            style={styles.input}
          />
        </View>
        {errors.name ? (
          <Text style={styles.errorText}>{errors.name}</Text>
        ) : null}
      </View>

      {/* Transfer Reason */}
      <View style={styles.section}>
        <Text style={styles.label}>Transfer Reason (Optional)</Text>

        <View
          style={[
            styles.inputBox,
            errors.reason && styles.inputErrorBox,
          ]}
        >
          <TextInput
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              if (errors.reason) {
                setErrors((prev) => ({ ...prev, reason: "" }));
              }
            }}
            placeholder="Add a note"
            placeholderTextColor="#777"
            style={styles.input}
          />
        </View>
        {errors.reason ? (
          <Text style={styles.errorText}>{errors.reason}</Text>
        ) : null}
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Ionicons
          name="information-circle-outline"
          size={22}
          color="#33C1FF"
        />
        <Text style={styles.infoText}>
          The receiver must be registered with this email. Transfers will fail
          if the email does not exist.
        </Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.continueBtn, isDisabled && styles.btnDisabled]}
        disabled={isDisabled}
        onPress={handleSend}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.continueText}>Continue</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0F", padding: 20 },

  /* HEADER */
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
  },

  /* SECTIONS & LABELS */
  section: { marginBottom: 20 },

  label: { color: "#bbb", fontSize: 15, marginBottom: 8 },

  /* INPUT FIELDS */
  inputBox: {
    backgroundColor: "#1A1A1C",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A2D",
    flexDirection: "row",
    alignItems: "center",
  },

  inputErrorBox: {
    borderColor: "#FF4A4A",
  },

  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
  },

  /* ERROR TEXT */
  errorText: {
    color: "#FF4A4A",
    fontSize: 12,
    marginTop: 4,
  },

  /* INFO BOX */
  infoBox: {
    backgroundColor: "#002C3C",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  infoText: {
    color: "#66D6FF",
    marginLeft: 10,
    fontSize: 13,
    flex: 1,
  },

  /* CONTINUE BUTTON */
  continueBtn: {
    marginTop: 30,
    backgroundColor: "#2F80ED",
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },

  btnDisabled: {
    backgroundColor: "#1E3A63",
    opacity: 0.5,
  },

  continueText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
