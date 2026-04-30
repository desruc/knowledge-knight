import { DataSource } from "typeorm";
import { SubmittedQuestion } from "./entities/submittedQuestion";
import { User } from "./entities/user";

export const db = new DataSource({
  type: "postgres",
  url: process.env.DB_URL,
  synchronize: true,
  entities: [User, SubmittedQuestion],
  subscribers: [],
  migrations: []
});
