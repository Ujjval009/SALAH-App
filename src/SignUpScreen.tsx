import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "./AuthContext";
import { colors } from "./theme";

export default function SignUpScreen({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) return Alert.alert("Error", "Please fill all fields");
    if (password !== confirmPassword) return Alert.alert("Error", "Passwords do not match");
    if (password.length < 6) return Alert.alert("Error", "Password must be at least 6 characters");
    setLoading(true);
    try {
      await signUp(email, password, displayName || undefined);
    } catch (e: any) {
      Alert.alert("Sign Up Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.container} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
      <View style={s.logoContainer}>
        <Text style={s.logo}>Salah</Text>
        <Text style={s.subtitle}>Create your account</Text>
      </View>

      <View style={s.form}>
        <TextInput
          style={s.input}
          placeholder="Display Name (optional)"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />
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
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TextInput
          style={s.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSignUp} disabled={loading}>
          <Text style={s.btnText}>{loading ? "Creating account..." : "Create Account"}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.switchContainer}>
        <Text style={s.switchText}>Already have an account?</Text>
        <TouchableOpacity onPress={onSwitchToSignIn}>
          <Text style={s.switchLink}>Sign In</Text>
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