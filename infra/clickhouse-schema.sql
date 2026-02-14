CREATE DATABASE IF NOT EXISTS zentro_logs;

CREATE TABLE IF NOT EXISTS zentro_logs.logs (
    timestamp DateTime64(3),
    projectId String,
    service String,
    container String,
    level String,
    message String,
    labels String DEFAULT '{}',
    metadata String DEFAULT '{}'
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (projectId, timestamp)
SETTINGS index_granularity = 8192;
