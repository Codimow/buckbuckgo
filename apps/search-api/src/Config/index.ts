import { Config, ConfigProvider } from "effect";

export const DatabaseConfig = Config.all({
  url: Config.string("DATABASE_URL").pipe(
    Config.withDefault(
      "postgres://buckbuckgo:postgres@localhost:5432/buckbuckgo",
    ),
  ),
  maxConnections: Config.number("DB_MAX_CONNECTIONS").pipe(
    Config.withDefault(20),
  ),
});

export const ServerConfig = Config.all({
  port: Config.number("PORT").pipe(Config.withDefault(4000)),
  nodeEnv: Config.string("NODE_ENV").pipe(Config.withDefault("development")),
});
