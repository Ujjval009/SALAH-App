import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "./AuthContext";
import { colors } from "./theme";

export default function SignInScreen({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) return Alert.alert("Error", "Please fill all fields");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert("Sign In Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.container} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
      <View style={s.logoContainer}>
        <Text style={s.logo}>Salah</Text>
        <Text style={s.subtitle}>Sign in to continue</Text>
      </View>

      <View style={s.form}>
        <TextInput
          style={s.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
        />
        <TouchableOpacity style={s.forgotBtn} onPress={() => Alert.prompt("Reset Password", "Enter your email", [{ text: "Cancel", style: "cancel" }, { text: "Send", onPress: (email: string | undefined) => { if (email) resetPassword(email); } }], "plain-text")}>
          <Text style={s.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSignIn} disabled={loading}>
          <Text style={s.btnText}>{loading ? "Signing in..." : "Sign In"}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.switchContainer}>
        <Text style={s.switchText}>Don't have an account?</Text>
        <TouchableOpacity onPress={onSwitchToSignUp}>
          <Text style={s.switchLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 24, justifyContent: "center" },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logo: { color: colors.text, fontSize: 40, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 16, marginTop: 8 },
  form: { width: "100%", gap: 16 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  forgotBtn: { alignSelf: "flex-end" },
  forgotText: { color: colors.accent, fontSize: 14 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.onAccent, fontSize: 16, fontWeight: "600" },
  switchContainer: { flexDirection: "row", justifyContent: "center", marginTop: 24, gap: 8 },
  switchText: { color: colors.muted, fontSize: 15 },
  switchLink: { color: colors.accent, fontSize: 15, fontWeight: "600" },
});