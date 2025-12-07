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
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { setAuthToken } from "../api/client";

export default function TopUpScreen({ navigation }) {
  const [amount, setAmount] = useState("");
  const [selectedCard, setSelectedCard] = useState("New Card");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // field-level errors
  const [errors, setErrors] = useState({
    amount: "",
    selectedCard: "",
  });

  const numericAmount = parseFloat(amount);
  const fee =
    amount && !isNaN(numericAmount)
      ? (numericAmount * 0.0).toFixed(2)
      : "0.00";

  const isDisabled = !amount || !selectedCard || loading;

  const handleTopUp = async () => {
    // clear old errors
    setErrors({
      amount: "",
      selectedCard: "",
    });

    let hasLocalError = false;
    const newErrors = {};

    // client validation
    if (isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = "Please enter a valid amount.";
      hasLocalError = true;
    }

    if (!selectedCard) {
      newErrors.selectedCard = "Please select a card.";
      hasLocalError = true;
    }

    if (hasLocalError) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return;
    }

    try {
      setLoading(true);

      // Get token from storage
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Session expired", "Please log in again.");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      setAuthToken(token);

      // 🔐 CALL BACKEND: POST /api/deposit
      const res = await api.post("/deposit", {
        amount: numericAmount,
      });

      console.log("TopUp response:", res.data);

      // Show success alert
      Alert.alert("Success", "Top up completed successfully.");

      // ✅ Navigate back to Wallet (works on mobile + web)
      navigation.reset({
        index: 0,
        routes: [{ name: "Wallet" }],
      });
    } catch (error) {
      console.log("TopUp error:", error?.response?.data || error.message);

      const validationErrors = error?.response?.data?.errors;
      const newErrorsFromServer = {};

      if (validationErrors) {
        if (validationErrors.amount) {
          newErrorsFromServer.amount = validationErrors.amount[0];
        }

        setErrors((prev) => ({ ...prev, ...newErrorsFromServer }));
      }

      const msg =
        error?.response?.data?.message ||
        (validationErrors
          ? "Please fix the highlighted fields."
          : "Could not complete top up. Please try again.");

      if (!validationErrors || Object.keys(newErrorsFromServer).length === 0) {
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Details</Text>
      </View>

      {/* AMOUNT */}
      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.label}>Amount to be added</Text>
          <Text style={styles.feeText}>Fee $ {fee}</Text>
        </View>

        <View
          style={[
            styles.inputBox,
            errors.amount && styles.inputErrorBox,
          ]}
        >
          <TextInput
            placeholder="0.00"
            placeholderTextColor="#777"
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              if (errors.amount) {
                setErrors((prev) => ({ ...prev, amount: "" }));
              }
            }}
          />
        </View>
        {errors.amount ? (
          <Text style={styles.errorText}>{errors.amount}</Text>
        ) : null}
      </View>

      {/* SELECT CARD */}
      <View style={styles.section}>
        <Text style={styles.label}>Select Card</Text>

        <TouchableOpacity
          style={[
            styles.cardDropdown,
            errors.selectedCard && styles.inputErrorBox,
          ]}
          onPress={() => {
            setDropdownOpen(!dropdownOpen);
            if (errors.selectedCard) {
              setErrors((prev) => ({ ...prev, selectedCard: "" }));
            }
          }}
        >
          <Text style={styles.cardText}>{selectedCard}</Text>
          <Feather
            name={dropdownOpen ? "chevron-up" : "chevron-down"}
            size={22}
            color="#ccc"
          />
        </TouchableOpacity>
        {errors.selectedCard ? (
          <Text style={styles.errorText}>{errors.selectedCard}</Text>
        ) : null}

        {/* DROPDOWN OPTIONS */}
        {dropdownOpen && (
          <View style={styles.dropdownMenu}>
            {/* Example card entries — static for now */}
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedCard("New Card");
                setDropdownOpen(false);
              }}
            >
              <Text style={styles.dropdownText}>New Card</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedCard("Visa •••• 1234");
                setDropdownOpen(false);
              }}
            >
              <Text style={styles.dropdownText}>Visa •••• 1234</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setSelectedCard("Mastercard •••• 5678");
                setDropdownOpen(false);
              }}
            >
              <Text style={styles.dropdownText}>Mastercard •••• 5678</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* CONTINUE BUTTON */}
      <TouchableOpacity
        disabled={isDisabled}
        style={[styles.continueBtn, isDisabled && styles.btnDisabled]}
        onPress={handleTopUp}
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

  /* LABELS & SECTIONS */
  section: { marginBottom: 25 },

  label: { color: "#bbb", fontSize: 15, marginBottom: 8 },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  balanceText: { color: "#2F80ED", fontSize: 14 },

  /* INPUTS */
  inputBox: {
    backgroundColor: "#1A1A1C",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A2D",
  },

  inputErrorBox: {
    borderColor: "#FF4A4A",
  },

  input: { color: "#fff", fontSize: 16 },

  feeText: { color: "#FF4A4A", fontSize: 14 },

  /* CARD DROPDOWN */
  cardDropdown: {
    backgroundColor: "#1A1A1C",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardText: { color: "#fff", fontSize: 16 },

  dropdownMenu: {
    backgroundColor: "#1A1A1C",
    borderRadius: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#333",
  },

  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2D",
  },

  dropdownText: {
    color: "#eee",
    fontSize: 16,
  },

  /* ERROR TEXT */
  errorText: {
    color: "#FF4A4A",
    fontSize: 12,
    marginTop: 4,
  },

  /* CONTINUE BUTTON */
  continueBtn: {
    marginTop: 20,
    backgroundColor: "#2F80ED",
    paddingVertical: 14,
    borderRadius: 35,
    alignItems: "center",
  },

  btnDisabled: {
    backgroundColor: "#1E3A63",
    opacity: 0.4,
  },

  continueText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
