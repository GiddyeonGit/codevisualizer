import { something } from "./nonexistent";

export function validFunction(): string {
  return "ok";
}

export class MissingClosing {
  constructor(name: string {
    this.name = name;
  }
