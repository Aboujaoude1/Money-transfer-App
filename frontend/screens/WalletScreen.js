import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import api, { setAuthToken } from "../api/client";

export default function WalletScreen({ navigation }) {
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState(null);
  const [balance, setBalance] = useState(0);

  // admin values
  const [totalBalance, setTotalBalance] = useState(undefined);
  const [allUsers, setAllUsers] = useState([]);

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadWalletData();
    }
  }, [isFocused]);

  const loadWalletData = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        return;
      }

      setAuthToken(token);

      // Load everything in parallel
      const [meRes, walletRes, txRes] = await Promise.all([
        api.get("/me"),
        api.get("/wallet"),
        api.get("/transactions"),
      ]);

      // ============================
      //  USER INFO
      // ============================
      const user = meRes.data?.user || meRes.data;
      setUserName(user?.name || "User");
      setUserId(user?.id || null);

      // ============================
      //  WALLET BALANCE
      // ============================
      const w = walletRes.data || {};

      const newBalance = w?.balance ?? w?.wallet?.balance ?? 0;
      const parsedBalance = Number(newBalance) || 0;

      setBalance(parsedBalance);

      // 🔥 SAVE BALANCE FOR WITHDRAW SCREEN
      await AsyncStorage.setItem(
        "walletBalance",
        parsedBalance.toString()
      );

      // ============================
      //  ADMIN — TOTAL BALANCE
      // ============================
      if (w.total_balance !== undefined && w.total_balance !== null) {
        setTotalBalance(Number(w.total_balance) || 0);
      } else {
        setTotalBalance(undefined);
      }

      // ============================
      //  ADMIN — USER LIST
      // ============================
      if (Array.isArray(w.users)) {
        setAllUsers(
          w.users.map((u) => ({
            ...u,
            balance: Number(u.balance ?? 0),
          }))
        );
      } else {
        setAllUsers([]);
      }

      // ============================
      //  TRANSACTIONS
      // ============================
      const txData = txRes.data;
      const txList = txData?.transactions || txData || [];

      setTransactions(Array.isArray(txList) ? txList : []);
    } catch (error) {
      console.log("Wallet load error:", error?.response?.data || error.message);

      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem("authToken");
        await AsyncStorage.removeItem("authUser");
        setAuthToken(null);
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      }
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     HELPERS
  =============================== */

  const getTypeLabel = (t) => {
    if (!t) return "Transaction";
    const type = t.toLowerCase();
    if (type === "deposit") return "Top-Up";
    if (type === "withdraw") return "Withdraw";
    if (type === "transfer") return "Transfer";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getNames = (tx) => {
    const fromName =
      tx.from_user?.name ||
      tx.fromUser?.name ||
      (tx.from_user_id ? `User #${tx.from_user_id}` : "System");

    const toName =
      tx.to_user?.name ||
      tx.toUser?.name ||
      (tx.to_user_id ? `User #${tx.to_user_id}` : "Wallet");

    return { fromName, toName };
  };

  const isOutgoing = (tx) => {
    const type = (tx.type || "").toLowerCase();
    if (type === "withdraw") return true;
    if (type === "deposit") return false;
    if (type === "transfer") return tx.from_user_id === userId;
    return false;
  };

  const totalExpenses = transactions.reduce((sum, tx) => {
    if (!isOutgoing(tx)) return sum;
    const amt = Number(tx.amount || 0);
    return isNaN(amt) ? sum : sum + amt;
  }, 0);

  /* ===============================
     UI RENDER
  =============================== */

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigation.navigate("ProfileDetails")}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{userName}</Text>
          <Text style={styles.userid}>{userId ? `ID•${userId}` : "ID•—"}</Text>
        </View>
      </View>

      {/* BALANCE CARD */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>

        {loading ? (
          <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />
        ) : (
          <Text style={styles.balanceValue}>$ {balance.toFixed(2)}</Text>
        )}

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => navigation.navigate("SendMoney")}>
            {renderAction("Send", "arrow-up-right")}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("TopUp")}>
            {renderAction("Top-Up", "plus-circle")}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Withdraw")}>
            {renderAction("Withdraw", "download")}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("ReceiveMoney")}>
            {renderAction("Receive", "arrow-down-left")}
          </TouchableOpacity>
        </View>
      </View>

      {/* ADMIN TOTAL BALANCE */}
      {totalBalance !== undefined && (
        <View style={styles.systemCard}>
          <Text style={styles.systemLabel}>All Users Total Balance</Text>
          <Text style={styles.systemAmount}>$ {totalBalance.toFixed(2)}</Text>
        </View>
      )}

      {/* ADMIN USER LIST */}
      {totalBalance !== undefined && allUsers.length > 0 && (
        <View style={styles.userListCard}>
          <Text style={styles.userListTitle}>User Balances</Text>

          {allUsers.map((u) => (
            <View key={u.id} style={styles.userRow}>
              <Text style={styles.userName}>{u.name}</Text>
              <Text style={styles.userBalance}>$ {u.balance.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* EXPENSE CARD */}
      <View style={styles.expenseCard}>
        <View style={styles.expenseHeader}>
          <Text style={styles.expenseTitle}>My Wallet Expenses</Text>
          <Ionicons name="information-circle-outline" size={18} color="#999" />
        </View>

        <Text style={styles.expenseAmount}>
          $ {totalExpenses.toFixed(2)}{" "}
          <Text style={styles.expenseNote}>
            {transactions.length === 0
              ? "No expenses yet"
              : "Sum of outgoing transactions"}
          </Text>
        </Text>

        <View style={styles.expenseBar} />
      </View>

      {/* TRANSACTIONS */}
      <View style={styles.transactionsCard}>
        <Text style={styles.transTitle}>Transactions</Text>

        {loading ? (
          <View style={styles.noTrans}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : transactions.length === 0 ? (
          <View style={styles.noTrans}>
            <Text style={styles.noTransTitle}>No Transactions Yet</Text>
            <Text style={styles.noTransDesc}>
              Use the app to transfer or receive money.
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 20 }}>
            {transactions.map((tx, index) => {
              const out = isOutgoing(tx);
              const amountNum = Number(tx.amount || 0);
              const displayAmount = `${out ? "-" : "+"} $ ${amountNum.toFixed(
                2
              )}`;

              const typeLabel = getTypeLabel(tx.type);
              const { fromName, toName } = getNames(tx);

              return (
                <View key={tx.id || index} style={styles.txRow}>
                  <View>
                    <Text style={styles.txTitle}>
                      {typeLabel} · {fromName} → {toName}
                    </Text>
                    {tx.created_at && (
                      <Text style={styles.txDate}>{tx.created_at}</Text>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.txAmount,
                      out && { color: "#FF4A4A" },
                    ]}
                  >
                    {displayAmount}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/* ACTION BUTTON */
function renderAction(label, icon) {
  return (
    <View style={styles.actionButton}>
      <Feather name={icon} size={26} color="#fff" />
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

/* =============================== */
/* STYLES */
/* =============================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0F",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: "#333",
    borderRadius: 25,
    marginRight: 12,
  },
  username: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  userid: {
    color: "#777",
    fontSize: 12,
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: "#1A1A1C",
    padding: 22,
    borderRadius: 18,
    marginBottom: 20,
  },
  balanceLabel: { color: "#bbb", fontSize: 15 },
  balanceValue: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
    marginTop: 6,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },
  actionButton: { alignItems: "center", width: 70 },
  actionLabel: { marginTop: 6, color: "#fff", fontSize: 12 },

  systemCard: {
    backgroundColor: "#1A1A1C",
    padding: 18,
    borderRadius: 16,
    marginBottom: 15,
  },
  systemLabel: { color: "#bbb", fontSize: 13 },
  systemAmount: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
  },

  userListCard: {
    backgroundColor: "#1A1A1C",
    padding: 18,
    borderRadius: 16,
    marginBottom: 25,
  },
  userListTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomColor: "#222",
    borderBottomWidth: 1,
  },
  userName: { color: "#fff", fontSize: 14 },
  userBalance: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "700",
  },

  expenseCard: {
    backgroundColor: "#1A1A1C",
    padding: 20,
    borderRadius: 16,
    marginBottom: 25,
  },
  expenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  expenseTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  expenseAmount: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 4,
  },
  expenseNote: { color: "#FFD700", fontSize: 12 },
  expenseBar: {
    height: 10,
    backgroundColor: "#333",
    borderRadius: 8,
  },

  transactionsCard: {
    backgroundColor: "#1A1A1C",
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
  },
  transTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  noTrans: {
    alignItems: "center",
    paddingVertical: 30,
    marginTop: 20,
  },
  noTransTitle: { color: "#fff", fontSize: 16, marginTop: 10 },
  noTransDesc: {
    color: "#888",
    textAlign: "center",
    fontSize: 12,
    marginTop: 5,
    paddingHorizontal: 10,
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  txTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  txDate: { color: "#777", fontSize: 11, marginTop: 2 },
  txAmount: {
    color: "#2F80ED",
    fontSize: 15,
    fontWeight: "600",
  },
});
