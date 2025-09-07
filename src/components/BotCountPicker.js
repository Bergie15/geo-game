import React from "react";
import { View, Text } from "react-native";
import { Picker } from "@react-native-picker/picker";

export default function BotCountPicker({ botCount, setBotCount, maxBots = 5 }) {
  return (
    <View style={{ width: "100%", marginBottom: 16 }}>
      <Text style={{ fontSize: 16, marginBottom: 8 }}>Bots:</Text>
      <Picker
        selectedValue={botCount}
        style={{ height: 50, width: 160, alignSelf: "center" }}
        onValueChange={setBotCount}
        mode="dropdown"
      >
        {[...Array(maxBots).keys()].map((i) => (
          <Picker.Item key={i} label={`${i + 1}`} value={i + 1} />
        ))}
      </Picker>
    </View>
  );
}
