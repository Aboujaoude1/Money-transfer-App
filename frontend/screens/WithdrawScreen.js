import React, { useState, useEffect } from "react";
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

export default function WithdrawScreen({ navigation }) {
  const [customAmount, setCustomAmount] = useState("");
  const [selected, setSelected] = useState(null); // 100, 200, 500, 1000, or "other"
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    amount: "",
  });

  const presetAmounts = ["100", "200", "500", "1000"];

  // Final amount (preset OR custom)
  const finalAmount =
    selected && selected !== "other" ? selected : customAmount;

  const numericAmount = parseFloat(finalAmount);

  // Disable button if no value or still loading
  const isDisabled = !numericAmount || isNaN(numericAmount) || loading;

  // Load wallet balance when screen opens
  useEffect(() => {
    const loadBalance = async () => {
      const bal = await AsyncStorage.getItem("walletBalance");
      if (bal) setWalletBalance(parseFloat(bal));
    };
    loadBalance();
  }, []);

  const handleWithdraw = async () => {
    setErrors({ amount: "" });

    // 1️⃣ Validate amount is numeric
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrors((prev) => ({
        ...prev,
        amount: "Please enter a valid amount.",
      }));
      return;
    }

    // 2️⃣ Check wallet balance
    if (numericAmount > walletBalance) {
      setErrors((prev) => ({
        ...prev,
        amount: "Insufficient wallet balance.",
      }));
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

      // 🔐 Send API request
      const res = await api.post("/withdraw", {
        amount: numericAmount,
        description: null,
      });

      console.log("Withdraw response:", res.data);

      Alert.alert("Success", "Withdraw completed successfully.");

      // Return to wallet
      navigation.reset({
        index: 0,
        routes: [{ name: "Wallet" }],
      });
    } catch (error) {
      console.log("Withdraw error:", error?.response?.data || error.message);

      const validationErrors = error?.response?.data?.errors;
      const newErrorsFromServer = {};

      if (validationErrors?.amount) {
        newErrorsFromServer.amount = validationErrors.amount[0];
        setErrors((prev) => ({ ...prev, ...newErrorsFromServer }));
      }

      const msg =
        error?.response?.data?.message ||
        "Could not complete withdrawal. Please try again.";

      Alert.alert("Error", msg);
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

        <Text style={styles.headerTitle}>Select Withdrawal Details</Text>
      </View>

      {/* WALLET BALANCE DISPLAY */}
      <Text style={styles.balanceText}>Wallet Balance: ${walletBalance}</Text>

      {/* SELECT AMOUNT */}
      <View style={styles.section}>
        <Text style={styles.label}>Select Amount</Text>

        <View style={styles.amountRow}>
          {presetAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[
                styles.amountBtn,
                selected === amt && styles.amountBtnActive,
              ]}
              onPress={() => {
                setSelected(amt);
                setCustomAmount("");
                setErrors({ amount: "" });
              }}
            >
              <Text
                style={[
                  styles.amountText,
                  selected === amt && styles.amountTextActive,
                ]}
              >
                USD{amt}
              </Text>
            </TouchableOpacity>
          ))}

          {/* OTHER Button */}
          <TouchableOpacity
            style={[
              styles.amountBtn,
              selected === "other" && styles.amountBtnActive,
            ]}
            onPress={() => {
              setSelected("other");
              setCustomAmount("");
              setErrors({ amount: "" });
            }}
          >
            <Text
              style={[
                styles.amountText,
                selected === "other" && styles.amountTextActive,
              ]}
            >
              Other
            </Text>
          </TouchableOpacity>
        </View>

        {/* ERROR (preset amount) */}
        {errors.amount && selected !== "other" ? (
          <Text style={styles.errorText}>{errors.amount}</Text>
        ) : null}
      </View>

      {/* CUSTOM INPUT */}
      {selected === "other" && (
        <View style={styles.section}>
          <View
            style={[
              styles.inputBox,
              errors.amount && styles.inputErrorBox,
            ]}
          >
            <TextInput
              placeholder="Enter amount"
              placeholderTextColor="#777"
              style={styles.input}
              keyboardType="numeric"
              value={customAmount}
              onChangeText={(text) => {
                setCustomAmount(text);
                setErrors({ amount: "" });
              }}
            />
          </View>

          {errors.amount ? (
            <Text style={styles.errorText}>{errors.amount}</Text>
          ) : null}
        </View>
      )}

      {/* AMOUNT FEE DISPLAY */}
      <View style={styles.feeBox}>
        <Text style={styles.feeValue}>
          ${numericAmount && !isNaN(numericAmount) ? numericAmount : "0.00"}
        </Text>
        <Text style={styles.feeNote}>
          fee will be deducted{"\n"}from your wallet
        </Text>
      </View>

      {/* CONTINUE BUTTON */}
      <TouchableOpacity
        disabled={isDisabled}
        style={[styles.continueBtn, isDisabled && styles.continueDisabled]}
        onPress={handleWithdraw}
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

  header: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 10,
  },

  balanceText: {
    color: "#2F80ED",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 20,
  },

  section: { marginBottom: 20 },
  label: { color: "#bbb", fontSize: 15, marginBottom: 8 },

  amountRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  amountBtn: {
    backgroundColor: "#1A1A1C",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },

  amountBtnActive: {
    backgroundColor: "#2F80ED",
    borderColor: "#2F80ED",
  },

  amountText: { color: "#ccc", fontSize: 15 },
  amountTextActive: { color: "#fff", fontWeight: "600" },

  inputBox: {
    backgroundColor: "#1A1A1C",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A2D",
  },
  inputErrorBox: { borderColor: "#FF4A4A" },
  input: { color: "#fff", fontSize: 16 },

  errorText: {
    color: "#FF4A4A",
    fontSize: 12,
    marginTop: 4,
  },

  feeBox: { marginTop: 40, alignItems: "center" },
  feeValue: { color: "#FF4A4A", fontSize: 22, fontWeight: "700" },
  feeNote: { color: "#ccc", textAlign: "center", fontSize: 13 },

  continueBtn: {
    marginTop: 50,
    backgroundColor: "#2F80ED",
    paddingVertical: 15,
    borderRadius: 35,
    alignItems: "center",
  },
  continueDisabled: { backgroundColor: "#1E3A63", opacity: 0.4 },
  continueText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});
