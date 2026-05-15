import { Serializable, Named } from "./interfaces";

export class BaseEntity {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export class User extends BaseEntity implements Serializable, Named {
  name: string;

  constructor(id: string, name: string) {
    super(id);
    this.name = name;
  }

  toJSON(): Record<string, unknown> {
    return { id: this.id, name: this.name };
  }

  getName(): string {
    return this.name;
  }
}
