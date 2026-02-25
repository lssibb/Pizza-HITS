import type { IEntity, ICostCalculable, ISerializable, IFilterable } from './interfaces'


export abstract class Entity implements IEntity, ISerializable {
  readonly id: string
  readonly createdAt: Date
  private _updatedAt: Date

  constructor(id?: string) {
    this.id = id ?? crypto.randomUUID()
    this.createdAt = new Date()
    this._updatedAt = new Date()
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  protected touch(): void {
    this._updatedAt = new Date()
  }

  abstract toJSON(): Record<string, unknown>
}
