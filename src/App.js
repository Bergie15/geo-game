import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";

// Future multiplayer: Replace local state with server sync logic
// Multiplayer stub: Use WebSocket or REST API to communicate with other players

const NUM_PLAYERS = 6;
const MIN_BOTS = 1;
const MAX_BOTS = 5;

function getInitialPlayers() {}

export default function App() {
  const [logoError, setLogoError] = useState(false);
  const [botCount, setBotCount] = useState(3);
  const [players, setPlayers] = useState([]);
  const [turn, setTurn] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [menu, setMenu] = useState(true); // Show start menu
  const [mode, setMode] = useState(null); // 'local' or 'multiplayer'

  // Stub: Replace with multiplayer turn logic
  function nextTurn() {
    if (turn >= (botCount + 1) * 5) {
      setGameOver(true);
      return;
    }
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        score: p.score + Math.floor(Math.random() * 10),
      }))
    );
    setTurn((t) => t + 1);
  }

  return (
    <View style={styles.container}>
      {!logoError ? (
        <Image
          source={require("../logo.png")}
          style={styles.logoFull}
          resizeMode="cover"
          accessibilityLabel="Geo Logo"
          onError={() => setLogoError(true)}
        />
      ) : (
        <View style={styles.logoFallbackFull}>
          <Text style={styles.logoFallbackText}>Geo </Text>
        </View>
      )}
      <View style={styles.overlay}>
        {menu ? (
          <View style={styles.menu}>
            <Text style={styles.menuSubtitle}>Select Mode:</Text>
            <Text style={styles.menuSubtitle}>Number of Bots:</Text>
            <View style={styles.botPickerRow}>
              {[...Array(MAX_BOTS).keys()].map((i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.bubbleButton,
                    botCount === i + 1 && styles.bubbleButtonActive,
                  ]}
                  onPress={() => setBotCount(i + 1)}
                >
                  <Text
                    style={[
                      styles.bubbleButtonText,
                      botCount === i + 1 && styles.bubbleButtonTextActive,
                    ]}
                  >
                    {i + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.bubbleButton}
              onPress={() => {
                setPlayers([
                  { name: "You", isBot: false, score: 0 },
                  ...Array(botCount)
                    .fill(0)
                    .map((_, i) => ({
                      name: `Bot ${i + 1}`,
                      isBot: true,
                      score: 0,
                    })),
                ]);
                setMode("local");
                setMenu(false);
              }}
            >
              <Text style={styles.bubbleButtonText}>Local</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bubbleButton}
              onPress={() => {
                setMode("multiplayer");
                setMenu(false);
              }}
            >
              <Text style={styles.bubbleButtonText}>Multiplayer (stub)</Text>
            </TouchableOpacity>
          </View>
        ) : mode === "local" ? (
          <View style={{ alignItems: "center" }}>
            <Text style={styles.title}>Local Game</Text>
            {players.map((p, i) => (
              <Text key={i} style={p.isBot ? styles.bot : styles.human}>
                {p.name}: {p.score}
              </Text>
            ))}
            {gameOver ? (
              <View>
                <Text style={styles.gameOver}>Game Over!</Text>
                <TouchableOpacity
                  style={styles.bubbleButton}
                  onPress={resetGame}
                >
                  <Text style={styles.bubbleButtonText}>Restart</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.bubbleButton} onPress={nextTurn}>
                <Text style={styles.bubbleButtonText}>Next Turn</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.menu}>
            <Text style={styles.title}>Multiplayer (Stub)</Text>
            <Text style={styles.menuSubtitle}>
              Multiplayer mode is not implemented yet.
            </Text>
            <TouchableOpacity style={styles.bubbleButton} onPress={resetGame}>
              <Text style={styles.bubbleButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Multiplayer stub: Add UI for joining/creating online games here */}
    </View>
  );
}

const styles = StyleSheet.create({
  botPickerRow: {
    flexDirection: "row",
    marginBottom: 16,
    justifyContent: "center",
  },
  bubbleButton: {
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 28,
    marginHorizontal: 6,
    marginVertical: 6,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  bubbleButtonActive: {
    borderColor: "#2870e0",
    backgroundColor: "#eaf3ff",
  },
  bubbleButtonText: {
    color: "#2870e0",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
  bubbleButtonTextActive: {
    color: "#174080",
  },
  logoFull: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
  },
  logoFallbackFull: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  overlay: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    backgroundColor: "rgba(40, 80, 160, 0.25)", // blue tint, less opacity
  },
  menu: {
    alignItems: "center",
    marginTop: 20,
  },
  menuSubtitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  logoFallback: {
    width: 200,
    height: 200,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  logoFallbackText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  human: {
    color: "blue",
    fontSize: 18,
    margin: 5,
  },
  bot: {
    color: "green",
    fontSize: 18,
    margin: 5,
  },
  gameOver: {
    fontSize: 22,
    color: "red",
    margin: 15,
  },
});
