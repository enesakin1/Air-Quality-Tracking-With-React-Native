import { StatusBar } from "expo-status-bar";
import React, { Component, useEffect } from "react";
import {
  StyleSheet,
  Text,
  SafeAreaView,
  Platform,
  Dimensions,
  Switch,
  ImageBackground,
  ActivityIndicator,
  View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { getStatusBarHeight } from "react-native-status-bar-height";
import firebase from "firebase";
import NumericInput from "react-native-numeric-input";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";
var firebaseConfig = {
  //Firebase config
};
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const { width, height } = Dimensions.get("window");
export default class App extends Component {
  constructor() {
    super();
    this.state = {
      buzzerisEnabled: false,
      ledisEnabled: false,
      hassasiyetState: 800,
      chartdegerleri: [10, 15, 25, 30, 35, 40],
      chartsaatleri: [12.0, 12.0, 12.0, 12.0, 12.0, 12.0],
      bestValue: 0,
      bestDay: "",
      worstValue: 0,
      worstDay: "",
      isLoaded: false,
      valuesLoaded: false,
      buzzerLoaded: false,
      ledLoaded: false,
      gasleak: false,
      readable: false,
      durumKotu: "Güvenli Değil",
      durumIyı: "Güvenli %",
    };
  }

  componentDidMount() {
    this.registerForPushNotificationsAsync();
    this.getGasleak();
    this.getHassasiyet();
    this.getLed();
    this.getBuzzer();
    this.getOlculenDeger();
    this.getReadable();
  }

  registerForPushNotificationsAsync = async () => {
    let token;
    if (Constants.isDevice) {
      const { status: existingStatus } = await Permissions.getAsync(
        Permissions.NOTIFICATIONS
      );
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Permissions.askAsync(
          Permissions.NOTIFICATIONS
        );
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
    firebase.database().ref("users").update({
      expoPushToken: token,
    });
  };

  getOlculenDeger = () => {
    var gecici = firebase.database().ref("olculendeger");
    gecici.on("value", (datasnap) => {
      this.setState({ chartdegerleri: datasnap.val() });
    });
    gecici = firebase.database().ref("hours");
    gecici.on("value", (datasnap) => {
      this.setState({ chartsaatleri: datasnap.val() });
    });
    gecici = firebase.database().ref("/bestvalue/date");
    gecici.on("value", (datasnap) => {
      this.setState({ bestDay: datasnap.val() });
    });
    gecici = firebase.database().ref("/bestvalue/value");
    gecici.on("value", (datasnap) => {
      this.setState({ bestValue: datasnap.val() });
    });
    gecici = firebase.database().ref("/worstvalue/date");
    gecici.on("value", (datasnap) => {
      this.setState({ worstDay: datasnap.val() });
    });
    gecici = firebase.database().ref("/worstvalue/value");
    gecici.on("value", (datasnap) => {
      this.setState({ worstValue: datasnap.val() });
    });
    this.setState({ valuesLoaded: true });
  };
  setBuzzer = () => {
    var temp = this.state.buzzerisEnabled;
    this.setState({
      buzzerisEnabled: !temp,
    });
    var kelime = firebase.database().ref("buzzer");
    kelime.set(this.state.buzzerisEnabled ? 0 : 1);
  };
  setLed = () => {
    this.setState({ ledisEnabled: !this.state.ledisEnabled });
    var kelime = firebase.database().ref("led");
    kelime.set(this.state.ledisEnabled ? 0 : 1);
  };
  setHassasiyet = (deger) => {
    this.setState({ hassasiyetState: deger });
    var kelime = firebase.database().ref("sensivity");
    kelime.set(deger);
  };
  getHassasiyet = () => {
    var deger = firebase.database().ref("sensivity");
    deger.on("value", (datasnap) => {
      this.setState({ hassasiyetState: datasnap.val(), isLoaded: true });
    });
  };
  getLed = () => {
    var kelime = firebase.database().ref("led");
    kelime.on("value", (datasnap) => {
      this.setState({ ledisEnabled: datasnap.val() == 0 ? false : true });
    });
    this.setState({ ledLoaded: true });
  };
  getBuzzer = () => {
    var kelime = firebase.database().ref("buzzer");
    kelime.on("value", (datasnap) => {
      this.setState({ buzzerisEnabled: datasnap.val() == 0 ? false : true });
    });
    this.setState({ buzzerLoaded: true });
  };
  getGasleak = () => {
    var kelime = firebase.database().ref("gasleak");
    kelime.on("value", (datasnap) => {
      this.setState({ gasleak: datasnap.val() == 0 ? false : true });
    });
  };
  getReadable = () => {
    var kelime = firebase.database().ref("control");
    kelime.on("value", (datasnap) => {
      this.setState({ readable: datasnap.val() == 0 ? false : true });
    });
  };
  render() {
    if (
      !this.state.isLoaded ||
      !this.state.valuesLoaded ||
      !this.state.buzzerLoaded ||
      !this.state.ledLoaded ||
      !this.state.readable
    ) {
      return (
        <View
          style={{ flex: 1, alignContent: "center", justifyContent: "center" }}
        >
          <ActivityIndicator
            size="large"
            animating={true}
            textContent={"Loading..."}
            color="#0000ff"
          ></ActivityIndicator>
        </View>
      );
    }
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ImageBackground
          source={require("./assets/arkaplan.jpg")}
          blurRadius={5}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={styles.grafik}>
            <Text style={styles.baslik}>KAYITLAR</Text>
            <LineChart
              data={{
                labels: this.state.chartsaatleri,
                datasets: [
                  {
                    data: this.state.chartdegerleri,
                  },
                ],
              }}
              width={width}
              height={height * 0.3}
              chartConfig={{
                backgroundColor: "#34d1c2",
                backgroundGradientFrom: "#3c98a6",
                backgroundGradientTo: "#34d1c2",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
              }}
              bezier
              style={styles.chart}
            />
          </SafeAreaView>

          <SafeAreaView style={styles.ackapa}>
            <SafeAreaView style={styles.ackapainside}>
              <Text style={styles.ackapatext}>Buzzer</Text>
              <Switch
                style={styles.buzzerswitch}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={this.state.buzzerisEnabled ? "#f5dd4b" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => this.setBuzzer()}
                value={this.state.buzzerisEnabled}
              />
            </SafeAreaView>
            <SafeAreaView style={styles.ackapainside}>
              <Text style={styles.ackapatext}>Led</Text>
              <Switch
                style={styles.ledswitch}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={this.state.ledisEnabled ? "#f5dd4b" : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => this.setLed()}
                value={this.state.ledisEnabled}
              />
            </SafeAreaView>
          </SafeAreaView>

          <SafeAreaView style={styles.durum}>
            <Text
              style={[
                styles.durumtext,
                { color: this.state.gasleak == 0 ? "green" : "red" },
              ]}
            >
              {this.state.gasleak == false
                ? this.state.durumIyı
                : this.state.durumKotu}
              {this.state.gasleak == false ? this.state.chartdegerleri[5] : ""}
            </Text>
          </SafeAreaView>

          <SafeAreaView style={styles.deger}>
            <Text style={styles.degertext}>Kaydedilen En İyi Değer</Text>
            <Text style={styles.degervalue}>
              {this.state.bestValue} - {this.state.bestDay}
            </Text>
            <Text style={[{ marginTop: 20 }, styles.degertext]}>
              Kaydedilen En Kötü Değer
            </Text>
            <Text style={styles.degervalue}>
              {this.state.worstValue} - {this.state.worstDay}
            </Text>
          </SafeAreaView>

          <SafeAreaView style={styles.hassasiyet}>
            <SafeAreaView>
              <Text style={styles.hassasiyettext}>
                Hassasiyet{" "}
                {this.state.hassasiyetState == 1050
                  ? "Devre Dışı Bırakıldı"
                  : ""}
              </Text>
            </SafeAreaView>
            <SafeAreaView
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <NumericInput
                value={this.state.hassasiyetState}
                onChange={(hassasiyetState) =>
                  this.setHassasiyet(hassasiyetState)
                }
                totalWidth={width * 0.5}
                totalHeight={50}
                iconSize={20}
                step={1}
                valueType="real"
                editable={false}
                rounded
                maxValue={1050}
                minValue={800}
                step={50}
                textColor="#38d9d4"
                iconStyle={{ color: "white" }}
                rightButtonBackgroundColor="#38d9d4"
                leftButtonBackgroundColor="#38d9d4"
              />
            </SafeAreaView>
          </SafeAreaView>

          <StatusBar hidden={true} />
        </ImageBackground>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  ackapatext: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f4252",
  },
  buzzerswitch: {
    transform: [{ scaleX: 1.45 }, { scaleY: 1.35 }],
    marginTop: 5,
  },
  ledswitch: {
    transform: [{ scaleX: 1.45 }, { scaleY: 1.35 }],
    marginTop: 5,
  },
  baslik: {
    textAlign: "center",
    padding: Platform.OS === "android" ? getStatusBarHeight() : 0,
    fontWeight: "bold",
  },
  grafik: {
    flex: 3.5,
  },
  ackapa: {
    flex: 1,
    flexDirection: "row",
  },
  ackapainside: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  durum: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  durumtext: {
    fontWeight: "bold",
    fontSize: 25,
  },
  deger: {
    flex: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  degervalue: {
    fontSize: 14,
    marginTop: 2,
  },
  degertext: {
    fontWeight: "bold",
    fontSize: 16,
  },
  hassasiyet: {
    flex: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  hassasiyettext: { fontWeight: "bold", fontSize: 18, marginBottom: 10 },
  chart: {
    marginVertical: -15,
    borderRadius: 16,
  },
  textInputStyle: {
    width: width * 0.5,
    backgroundColor: "#dde8c9",
    borderRadius: 0.25,
  },
});
