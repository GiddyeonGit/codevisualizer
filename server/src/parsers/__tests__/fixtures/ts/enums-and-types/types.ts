export enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}

export enum Direction {
  Up = "UP",
  Down = "DOWN",
}

export type Status = "active" | "inactive" | "pending";

export interface Config {
  theme: Color;
  direction: Direction;
  status: Status;
}

export const DEFAULT_CONFIG: Config = {
  theme: Color.Blue,
  direction: Direction.Up,
  status: "active",
};
