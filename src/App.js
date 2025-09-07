import React, { useState } from "react";
import { Picker } from "@react-native-picker/picker";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import HamburgerButton from "./components/HamburgerButton";

// Future multiplayer: Replace local state with server sync logic
// Multiplayer stub: Use WebSocket or REST API to communicate with other players

const NUM_PLAYERS = 6;
const MIN_BOTS = 1;
const MAX_BOTS = 5;

function getInitialPlayers() {}

export default function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  function goHome() {
    setMenu(true);
    setMode(null);
    setPlayers([]);
    setTurn(0);
    setGameOver(false);
    setShowBotModal(false);
    setDrawerOpen(false);
  }
  function showRules() {
    setDrawerOpen(false);
    Alert.alert(
      "Game Rules",
      "Guess the location! Each player (or bot) takes turns. The player with the highest score after all rounds wins."
    );
  }
  const [logoError, setLogoError] = useState(false);
  const [botCount, setBotCount] = useState(3);
  const [players, setPlayers] = useState([]);
  const [turn, setTurn] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [menu, setMenu] = useState(true); // Show start menu
  const [mode, setMode] = useState(null); // 'local' or 'multiplayer'
  const [showBotModal, setShowBotModal] = useState(false);

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
            <TouchableOpacity
              style={styles.bubbleButton}
              onPress={() => {
                setShowBotModal(true);
              }}
            >
              <Text style={styles.bubbleButtonText}>Local</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bubbleButton, { opacity: 0.5 }]}
              disabled={true}
            >
              <Text style={[styles.bubbleButtonText, { color: "#888" }]}>
                Multiplayer (stub)
              </Text>
            </TouchableOpacity>
            {showBotModal && (
              <View style={styles.modalBackdrop}>
                <View style={styles.modalContent}>
                  <Text style={styles.menuSubtitle}>
                    Select Number of Bots:
                  </Text>
                  <View style={{ width: "100%", marginBottom: 16 }}>
                    {/* Picker dropdown for bot count selection */}
                    <Text style={{ fontSize: 16, marginBottom: 8 }}>Bots:</Text>
                    <Picker
                      selectedValue={botCount}
                      style={{ height: 50, width: 160, alignSelf: "center" }}
                      onValueChange={(itemValue) => setBotCount(itemValue)}
                      mode="dropdown"
                    >
                      {[...Array(MAX_BOTS).keys()].map((i) => (
                        <Picker.Item key={i} label={`${i + 1}`} value={i + 1} />
                      ))}
                    </Picker>
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
                      setShowBotModal(false);
                    }}
                  >
                    <Text style={styles.bubbleButtonText}>Start Game</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bubbleButton}
                    onPress={() => setShowBotModal(false)}
                  >
                    <Text style={styles.bubbleButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : mode === "local" ? (
          <View style={{ alignItems: "center", flex: 1, width: "100%" }}>
            <HamburgerButton onPress={() => setDrawerOpen(true)} />
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
            {drawerOpen && (
              <View style={styles.drawerBackdrop}>
                <View style={styles.drawerContent}>
                  <TouchableOpacity
                    style={styles.drawerButton}
                    onPress={goHome}
                  >
                    <Text style={styles.drawerButtonText}>Home</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.drawerButton}
                    onPress={showRules}
                  >
                    <Text style={styles.drawerButtonText}>Rules</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.drawerButton}
                    onPress={() => setDrawerOpen(false)}
                  >
                    <Text style={styles.drawerButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.menu}>
            <HamburgerButton onPress={() => setDrawerOpen(true)} />
            <Text style={styles.title}>Multiplayer (Stub)</Text>
            <Text style={styles.menuSubtitle}>
              Multiplayer mode is not implemented yet.
            </Text>
            <TouchableOpacity style={styles.bubbleButton} onPress={resetGame}>
              <Text style={styles.bubbleButtonText}>Back</Text>
            </TouchableOpacity>
            {drawerOpen && (
              <View style={styles.drawerBackdrop}>
                <View style={styles.drawerContent}>
                  <TouchableOpacity
                    style={styles.drawerButton}
                    onPress={goHome}
                  >
                    <Text style={styles.drawerButtonText}>Home</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.drawerButton}
                    onPress={showRules}
                  >
                    <Text style={styles.drawerButtonText}>Rules</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.drawerButton}
                    onPress={() => setDrawerOpen(false)}
                  >
                    <Text style={styles.drawerButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
      {/* Multiplayer stub: Add UI for joining/creating online games here */}
    </View>
  );
}

const styles = StyleSheet.create({
  drawerBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.2)",
    zIndex: 20,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    display: "flex",
  },
  drawerContent: {
    width: 220,
    height: "100%",
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    alignItems: "flex-start",
  },
  drawerButton: {
    backgroundColor: "#eaf3ff",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginVertical: 10,
    alignItems: "center",
    width: "100%",
  },
  drawerButtonText: {
    color: "#2870e0",
    fontWeight: "bold",
    fontSize: 18,
    letterSpacing: 1,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 260,
    maxWidth: "80%",
  },
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
