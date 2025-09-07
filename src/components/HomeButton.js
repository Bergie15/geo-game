import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function HomeButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.homeButton} onPress={onPress}>
      <Text style={styles.homeButtonText}>Home</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  homeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "#eee",
    zIndex: 100,
  },
  homeButtonText: {
    color: "#2870e0",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
});
