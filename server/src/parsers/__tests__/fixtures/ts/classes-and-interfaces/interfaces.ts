export interface Serializable {
  toJSON(): Record<string, unknown>;
}

export interface Named {
  getName(): string;
}
