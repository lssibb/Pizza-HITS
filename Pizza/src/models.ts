import type { IEntity, ICostCalculable, IFilterable } from './interfaces'

// ===== БАЗОВЫЙ КЛАСС =====
export abstract class Entity implements IEntity {
  readonly id: string

  constructor(id?: string) {
    this.id = id ?? crypto.randomUUID()
  }
}

// ===== ИНГРЕДИЕНТ =====
export class Ingredient extends Entity implements ICostCalculable, IFilterable {
  private _name: string
  private _cost: number

  constructor(name: string, cost: number, id?: string) {
    super(id)
    this._name = name
    this._cost = cost
  }

  get name(): string { return this._name }
  set name(value: string) { this._name = value }

  get cost(): number { return this._cost }
  set cost(value: number) {
    if (value < 0) throw new Error('Стоимость не может быть отрицательной')
    this._cost = value
  }

  calculateCost(): number { return this._cost }

  matchesFilter(query: string): boolean {
    return this._name.toLowerCase().includes(query.toLowerCase())
  }
}

// ===== ОСНОВА ДЛЯ ПИЦЦЫ =====
export const BaseType = {
  Classic: 'classic',
  Black: 'black',
  Thick: 'thick',
} as const

export type BaseType = typeof BaseType[keyof typeof BaseType]

export abstract class PizzaBase extends Entity implements ICostCalculable, IFilterable {
  private _name: string
  protected _cost: number
  abstract readonly type: BaseType

  constructor(name: string, cost: number, id?: string) {
    super(id)
    this._name = name
    this._cost = cost
  }

  get name(): string { return this._name }
  set name(value: string) { this._name = value }

  get cost(): number { return this._cost }
  set cost(value: number) {
    if (value < 0) throw new Error('Стоимость не может быть отрицательной')
    this._cost = value
  }

  calculateCost(): number { return this._cost }

  abstract validateCost(classicCost: number): boolean

  matchesFilter(query: string): boolean {
    return this._name.toLowerCase().includes(query.toLowerCase())
  }
}

export class ClassicBase extends PizzaBase {
  readonly type = BaseType.Classic

  validateCost(_classicCost: number): boolean {
    return this._cost >= 0
  }
}

export class BlackBase extends PizzaBase {
  readonly type = BaseType.Black

  validateCost(classicCost: number): boolean {
    return this._cost >= 0 && this._cost <= classicCost * 1.2
  }
}

export class ThickBase extends PizzaBase {
  readonly type = BaseType.Thick

  validateCost(classicCost: number): boolean {
    return this._cost >= 0 && this._cost <= classicCost * 1.2
  }
}

export function createPizzaBase(type: BaseType, name: string, cost: number, id?: string): PizzaBase {
  switch (type) {
    case BaseType.Classic: return new ClassicBase(name, cost, id)
    case BaseType.Black: return new BlackBase(name, cost, id)
    case BaseType.Thick: return new ThickBase(name, cost, id)
  }
}

// ===== ПИЦЦА =====
export class Pizza extends Entity implements ICostCalculable, IFilterable {
  private _name: string
  private _ingredients: Ingredient[]
  private _base: PizzaBase

  constructor(name: string, ingredients: Ingredient[], base: PizzaBase, id?: string) {
    super(id)
    this._name = name
    this._ingredients = [...ingredients]
    this._base = base
  }

  get name(): string { return this._name }
  set name(value: string) { this._name = value }

  get ingredients(): Ingredient[] { return [...this._ingredients] }
  get base(): PizzaBase { return this._base }

  addIngredient(ingredient: Ingredient): void {
    this._ingredients.push(ingredient)
  }

  removeIngredient(id: string): void {
    this._ingredients = this._ingredients.filter(i => i.id !== id)
  }

  calculateCost(): number {
    const ingCost = this._ingredients.reduce((sum, i) => sum + i.cost, 0)
    return ingCost + this._base.calculateCost()
  }

  matchesFilter(query: string): boolean {
    const q = query.toLowerCase()
    return this._name.toLowerCase().includes(q)
      || this._ingredients.some(i => i.name.toLowerCase().includes(q))
  }
}
