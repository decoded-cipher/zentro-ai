#!/bin/bash

PLUGIN_DIR="/usr/share/confluent-hub-components/clickhouse-sink"
JAR_FILE="$PLUGIN_DIR/clickhouse-kafka-connect-v1.0.0-confluent.jar"

if [ ! -f "$JAR_FILE" ]; then
    cd /tmp
    curl -L https://github.com/ClickHouse/clickhouse-kafka-connect/releases/download/v1.0.0/clickhouse-kafka-connect-v1.0.0.zip -o connector.zip
    jar xf connector.zip
    mkdir -p "$PLUGIN_DIR"
    mv clickhouse-kafka-connect-v1.0.0/* "$PLUGIN_DIR/"
    mv "$PLUGIN_DIR/lib"/*.jar "$PLUGIN_DIR/"
    rm -rf connector.zip clickhouse-kafka-connect-v1.0.0
fi

exec /etc/confluent/docker/run
