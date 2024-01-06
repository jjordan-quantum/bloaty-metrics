import {DataSource} from "typeorm";
import {settings} from "./settings";
import {MetricsCounter} from "../../src/entitiy/MetricsCounter";

export function getDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: settings.pgHost,
    port: settings.pgPort,
    username: settings.pgUser,
    password: settings.pgPassword,
    database: settings.pgDatabase,
    synchronize: false,
    logging: false,
    entities: [
      MetricsCounter,
    ],
    migrations: [],
    subscribers: [],
    extra: { max: settings.maxWritePoolConnections },
  });
}
