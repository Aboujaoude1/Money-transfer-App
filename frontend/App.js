// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import RegisterScreen from "./screens/RegisterScreen";
import WalletScreen from "./screens/WalletScreen";
import SendMoneyScreen from "./screens/SendMoneyScreen";
import WithdrawScreen from "./screens/WithdrawScreen";
import TopUpScreen from "./screens/TopUpScreen";
import ReceiveMoneyScreen from "./screens/ReceiveMoneyScreen";
import ProfileDetailsScreen from "./screens/ProfileDetailsScreen";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import AdminLoginScreen from "./screens/AdminLoginScreen";
import AdminDashboardScreen from "./screens/AdminDashboardScreen";
import AdminUsersScreen from "./screens/AdminUsersScreen";
import AdminTransactionsScreen from "./screens/AdminTransactionsScreen";
import AdminUserDetailsScreen from "./screens/AdminUserDetailsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
        <Stack.Screen name="Withdraw" component={WithdrawScreen} />
        <Stack.Screen name="TopUp" component={TopUpScreen} />
        <Stack.Screen name="ReceiveMoney" component={ReceiveMoneyScreen} />
        <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />   
        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <Stack.Screen name="AdminUserDetails" component={AdminUserDetailsScreen}/>
        <Stack.Screen name="AdminTransactions" component={AdminTransactionsScreen}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
