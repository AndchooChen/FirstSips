// src/App.tsx
import React from "react";
import { View, Text, SafeAreaView } from "react-native";

const App = () => (
    <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>Welcome to FirstSips! ☕</Text>
        </View>
    </SafeAreaView>
);

export default App;