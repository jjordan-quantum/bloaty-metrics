import {config} from "dotenv";
config();

export type Settings = {
  maxWritePoolConnections: number;
  pgHost: string;
  pgPort: number;
  pgUser: string;
  pgPassword: string;
  pgDatabase: string;
}

export const settings: Settings = {
  maxWritePoolConnections: parseInt(process.env.MAX_WRITE_POOL_CONNECTIONS || '10'),
  pgHost: process.env.PH_HOST as string,
  pgPort: parseInt(process.env.PG_PORT || '5432'),
  pgUser: process.env.PG_USER as string,
  pgPassword: process.env.PG_PASSWORD as string,
  pgDatabase: process.env.PG_DATABASE as string,
}
