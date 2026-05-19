import mqtt from "mqtt";

let client: any = null;
let heartbeatTimer: any = null;
const HEARTBEAT_TOPIC_PREFIX = "GID_live@@@";
let _subscribedTopics: string[] = [];
let _messageCallback: ((topic: string, message: any) => void) | null = null;

let _connectParams: {
  clientId: string;
  liveId?: string;
  userId?: string;
  topic?: string;
  username?: string;
  password?: string;
} | null = null;

function getTopicCandidates(topic?: string) {
  if (!topic?.trim()) {
    return [];
  }

  const normalizedTopic = topic.trim().replace(/^\/+/, "");
  const topicCandidates = [normalizedTopic];

  if (!normalizedTopic.startsWith("live/")) {
    topicCandidates.push(`live/${normalizedTopic}`);
  }

  return [...new Set(topicCandidates)];
}

function rememberSubscribedTopic(topic: string) {
  if (!_subscribedTopics.includes(topic)) {
    _subscribedTopics.push(topic);
  }
}

function getMessageText(message: any) {
  if (typeof message === "string") {
    return message;
  }

  if (typeof message?.toString === "function") {
    return message.toString();
  }

  return String(message ?? "");
}

function startHeartbeat(clientId: string) {
  stopHeartbeat();

  heartbeatTimer = setInterval(() => {
    if (client && client.connected) {
      const heartbeatTopic = `${HEARTBEAT_TOPIC_PREFIX}${clientId}`;
      console.log("[MQTT] sending heartbeat", {
        topic: heartbeatTopic,
      });
      client.publish(heartbeatTopic, "heartbeat", (error?: Error | null) => {
        if (error) {
          console.error("[MQTT] heartbeat publish failed", {
            topic: heartbeatTopic,
            error: error.message,
          });
          return;
        }

        console.log("[MQTT] heartbeat publish success", {
          topic: heartbeatTopic,
        });
      });
    } else {
      stopHeartbeat();
    }
  }, 30000);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export function connectMqtt({
  clientId,
  liveId,
  userId,
  topic,
  username,
  password,
}: {
  clientId: string;
  liveId?: string;
  userId?: string;
  topic?: string;
  username?: string;
  password?: string;
}) {
  _connectParams = {
    clientId,
    liveId,
    userId,
    topic,
    username,
    password,
  };

  const topicCandidates = getTopicCandidates(topic);

  console.log("[MQTT] creating new connection", {
    clientId,
    liveId,
    userId,
    requestedTopic: topic || "(empty)",
    topicCandidates,
  });

  if (client) {
    disconnect();
  }

  return new Promise((resolve, reject) => {
    const mqttHost =
      import.meta.env.VITE_MQTT_HOST || "wss://118.24.178.211:8084/mqtt";
    const mqttUsername = import.meta.env.VITE_MQTT_USERNAME || username;
    const mqttPassword = import.meta.env.VITE_MQTT_PASSWORD || password;

    const options = {
      clean: true,
      connectTimeout: 30000,
      keepalive: 30,
      clientId,
      username: mqttUsername,
      password: mqttPassword,
      reconnectPeriod: 1000,
      maxReconnectAttempts: 10,
    };

    console.log("[MQTT] connect start", {
      url: mqttHost,
      clientId,
      username: mqttUsername || "(empty)",
      password: mqttPassword ? "****" : "(empty)",
      clean: options.clean,
      keepalive: options.keepalive,
      topicCandidates,
    });

    client = mqtt.connect(mqttHost, options);
    _subscribedTopics = [];

    let isFirstConnect = true;

    client.on("connect", (connack: any) => {
      console.log("[MQTT] connect success", {
        url: mqttHost,
        clientId,
        connected: client?.connected === true,
        sessionPresent: connack?.sessionPresent ?? false,
      });

      if (isFirstConnect) {
        isFirstConnect = false;
        resolve(client);
      }

      if (!topicCandidates.length) {
        console.warn("[MQTT] no topic configured, skip subscribe", {
          clientId,
        });
      }

      topicCandidates.forEach((currentTopic) => {
        console.log("[MQTT] subscribe start", {
          topic: currentTopic,
          qos: 1,
        });

        client.subscribe(currentTopic, { qos: 1 }, (err: any, granted: any) => {
          if (err) {
            console.error("[MQTT] subscribe failed", {
              topic: currentTopic,
              error: err?.message || err,
            });
            return;
          }

          rememberSubscribedTopic(currentTopic);
          console.log("[MQTT] subscribe success", {
            topic: currentTopic,
            granted,
            subscribedTopics: [..._subscribedTopics],
          });
        });
      });

      startHeartbeat(clientId);
    });

    client.on("message", (receivedTopic: string, message: any) => {
      const text = getMessageText(message);

      console.log("[MQTT] message received", {
        topic: receivedTopic,
        message: text,
        subscribedTopics: [..._subscribedTopics],
      });

      if (_messageCallback) {
        try {
          _messageCallback(receivedTopic, message);
        } catch (error: any) {
          console.error("[MQTT] message callback failed", {
            topic: receivedTopic,
            error: error?.message || error,
          });
        }
      } else {
        console.warn("[MQTT] message dropped, no callback registered", {
          topic: receivedTopic,
        });
      }
    });

    client.on("error", (err: any) => {
      console.error("[MQTT] connect failed", {
        url: mqttHost,
        clientId,
        connected: client?.connected === true,
        error: err?.message || err,
      });

      if (isFirstConnect) {
        reject(err);
      }
    });

    client.on("reconnect", () => {
      console.log("[MQTT] reconnecting", {
        url: mqttHost,
        clientId,
        subscribedTopics: [..._subscribedTopics],
      });
    });

    client.on("close", () => {
      stopHeartbeat();
      console.log("[MQTT] connection closed", {
        clientId,
        subscribedTopics: [..._subscribedTopics],
      });
    });

    client.on("offline", () => {
      stopHeartbeat();
      console.log("[MQTT] offline", {
        clientId,
        subscribedTopics: [..._subscribedTopics],
      });
    });
  });
}

export function publish(topic: string, message: string) {
  const publishTopic = "live/" + topic;

  if (client && client.connected) {
    console.log("[MQTT] publish start", {
      topic: publishTopic,
      message,
    });

    client.publish(publishTopic, message, (error?: Error | null) => {
      if (error) {
        console.error("[MQTT] publish failed", {
          topic: publishTopic,
          error: error.message,
        });
        return;
      }

      console.log("[MQTT] publish success", {
        topic: publishTopic,
      });
    });
  } else {
    console.warn("[MQTT] publish skipped, client not connected", {
      topic: publishTopic,
    });
  }
}

export function onMessage(callback: (topic: string, message: any) => void) {
  _messageCallback = callback;

  console.log("[MQTT] message callback registered", {
    hasClient: !!client,
    connected: client?.connected === true,
  });
}

export function reconnect() {
  if (_connectParams) {
    console.log("[MQTT] manual reconnect");

    if (client) {
      try {
        client.end(true);
        client = null;
      } catch (error) {
        console.error("[MQTT] disconnect before reconnect failed", error);
        client = null;
      }
    }

    return connectMqtt(_connectParams);
  }

  console.warn("[MQTT] reconnect skipped, no saved params");
  return Promise.reject("No connection parameters");
}

export function disconnect() {
  stopHeartbeat();

  if (client) {
    try {
      client.end(true);
      client = null;
    } catch (error) {
      console.error("[MQTT] disconnect error", error);
      client = null;
    }
  }

  _subscribedTopics = [];
  _connectParams = null;
}
