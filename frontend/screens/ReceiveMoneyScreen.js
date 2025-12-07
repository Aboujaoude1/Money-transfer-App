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

export default function ReceiveMoneyScreen({ navigation }) {
  const [sender, setSender] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);

  const isDisabled = !sender || !amount || loadingUser;

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoadingUser(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        Alert.alert("Session expired", "Please log in again.");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      setAuthToken(token);

      const res = await api.get("/me");
      const user = res.data?.user || res.data;

      setUserName(user?.name || "User");
      setUserEmail(user?.email || "");
      setUserId(user?.id || null);
    } catch (error) {
      console.log("Receive screen /me error:", error?.response?.data || error.message);
      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("authUser");
        setAuthToken(null);
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      } else {
        Alert.alert("Error", "Could not load your profile.");
      }
    } finally {
      setLoadingUser(false);
    }
  };

  const handleGenerate = () => {
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    if (!userEmail) {
      Alert.alert(
        "Error",
        "Your email could not be loaded. Please go back and try again."
      );
      return;
    }

    const summary = `Ask ${sender} to send you $${numericAmount.toFixed(
      2
    )} to this email:\n\n${userEmail}\n\n${
      note ? "Note: " + note : ""
    }`;

    Alert.alert("Request generated", summary);
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receive Money</Text>
      </View>

      {/* YOUR INFO FROM BACKEND */}
      <View style={styles.section}>
        <Text style={styles.label}>Your Details</Text>
        <View style={styles.infoBox}>
          {loadingUser ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.infoText}>
                Name: <Text style={styles.infoHighlight}>{userName}</Text>
              </Text>
              {userId && (
                <Text style={styles.infoText}>
                  ID: <Text style={styles.infoHighlight}>{userId}</Text>
                </Text>
              )}
              <Text style={styles.infoText}>
                Email to receive on:
              </Text>
              <Text style={styles.infoEmail}>{userEmail || "—"}</Text>
            </>
          )}
        </View>
      </View>

      {/* WHO IS SENDING */}
      <View style={styles.section}>
        <Text style={styles.label}>Who will send you money?</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Name or contact"
            placeholderTextColor="#777"
            style={styles.input}
            value={sender}
            onChangeText={setSender}
          />
        </View>
      </View>

      {/* AMOUNT */}
      <View style={styles.section}>
        <Text style={styles.label}>Amount to receive</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="0.00"
            placeholderTextColor="#777"
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </View>

      {/* OPTIONAL NOTE */}
      <View style={styles.section}>
        <Text style={styles.label}>Note (optional)</Text>
        <View style={styles.inputBox}>
          <TextInput
            placeholder="Write a short note"
            placeholderTextColor="#777"
            style={styles.input}
            value={note}
            onChangeText={setNote}
          />
        </View>
      </View>

      {/* BUTTON */}
      <TouchableOpacity
        disabled={isDisabled}
        style={[styles.continueBtn, isDisabled && styles.btnDisabled]}
        onPress={handleGenerate}
      >
        <Text style={styles.continueText}>Generate Request</Text>
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

  /* SECTIONS */
  section: { marginBottom: 25 },
  label: { color: "#bbb", fontSize: 15, marginBottom: 8 },

  /* YOUR INFO BOX */
  infoBox: {
    backgroundColor: "#1A1A1C",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  infoText: {
    color: "#bbb",
    fontSize: 14,
    marginBottom: 4,
  },
  infoHighlight: {
    color: "#fff",
    fontWeight: "600",
  },
  infoEmail: {
    color: "#2F80ED",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },

  /* INPUT BOX */
  inputBox: {
    backgroundColor: "#1A1A1C",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  input: { color: "#fff", fontSize: 16 },

  /* BUTTON */
  continueBtn: {
    marginTop: 10,
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
