import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryColumn("varchar")
  id: string;

  @Column("varchar")
  guild: string;

  @Column("int", { default: 0 })
  currentStreak: number;

  @Column("int", { default: 0 })
  highestStreak: number;

  @Column("int", { default: 0 })
  currentPoints: number;

  @Column("int", { default: 0 })
  highestPoints: number;

  @Column("int", { default: 0 })
  totalCorrectAnswers: number;

  @Column("int", { default: 0 })
  totalAnswers: number;

  @Column("boolean", { default: false })
  answered: boolean;
}
