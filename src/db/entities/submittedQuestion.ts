import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

export type SubmittedQuestionType = "tf" | "mcq";

@Entity()
export class SubmittedQuestion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar")
  submitterId: string;

  @Column("varchar")
  submitterUsername: string;

  @Column("varchar")
  type: SubmittedQuestionType;

  @Column("text")
  question: string;

  @Column("varchar")
  correctAnswer: string;

  @Column({ type: "simple-json" })
  incorrectAnswers: string[];

  @Column({ type: "timestamptz", nullable: true })
  usedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
