import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function HamburgerButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.hamburgerButton} onPress={onPress}>
      <Text style={styles.hamburgerIcon}>☰</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hamburgerButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 100,
    padding: 10,
  },
  hamburgerIcon: {
    fontSize: 32,
    color: "#2870e0",
    fontWeight: "bold",
  },
});
