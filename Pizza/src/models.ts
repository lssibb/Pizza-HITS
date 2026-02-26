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

export const CrustListMode = {
  Whitelist: 'whitelist',
  Blacklist: 'blacklist',
} as const

export type CrustListMode = typeof CrustListMode[keyof typeof CrustListMode]

export class Crust extends Entity implements ICostCalculable, IFilterable {
  private _name: string
  private _ingredients: Ingredient[]
  private _listMode: CrustListMode
  private _pizzaIds: string[]  

  constructor(name: string, ingredients: Ingredient[], listMode: CrustListMode, pizzaIds: string[], id?: string) {
    super(id)
    this._name = name
    this._ingredients = [...ingredients]
    this._listMode = listMode
    this._pizzaIds = [...pizzaIds]
  }

  get name(): string { return this._name }
  get ingredients(): Ingredient[] { return [...this._ingredients] }
  get listMode(): CrustListMode { return this._listMode }
  get pizzaIds(): string[] { return [...this._pizzaIds] }

  isCompatibleWith(pizzaId: string): boolean {
    const isInList = this._pizzaIds.includes(pizzaId)
    return this._listMode === CrustListMode.Whitelist ? isInList : !isInList
  }

  calculateCost(): number {
    return this._ingredients.reduce((sum, i) => sum + i.cost, 0)
  }

  matchesFilter(query: string): boolean {
    return this._name.toLowerCase().includes(query.toLowerCase())
  }
}

export const PizzaSize = {
  Small: 'small',
  Medium: 'medium',
  Large: 'large',
} as const

export type PizzaSize = typeof PizzaSize[keyof typeof PizzaSize]

export const SLICE_COUNTS: Record<PizzaSize, number> = {
  small: 6,
  medium: 8,
  large: 12,
}

export abstract class OrderItem extends Entity implements ICostCalculable {
  protected _size: PizzaSize
  protected _base: PizzaBase
  protected _crust: Crust | null

  constructor(size: PizzaSize, base: PizzaBase, crust?: Crust, id?: string) {
    super(id)
    this._size = size
    this._base = base
    this._crust = crust ?? null
  }

  get size(): PizzaSize { return this._size }
  get base(): PizzaBase { return this._base }
  get crust(): Crust | null { return this._crust }

  abstract calculateCost(): number
  abstract describe(): string
}

export class SavedPizzaItem extends OrderItem {
  private _pizza: Pizza
  private _doubledIngredientIds: Set<string>

  constructor(pizza: Pizza, size: PizzaSize, base: PizzaBase, crust?: Crust, doubledIds?: string[]) {
    super(size, base, crust)
    this._pizza = pizza
    this._doubledIngredientIds = new Set(doubledIds ?? [])
  }

  get pizza(): Pizza { return this._pizza }

  calculateCost(): number {
    let cost = this._pizza.calculateCost()
    for (const ing of this._pizza.ingredients) {
      if (this._doubledIngredientIds.has(ing.id)) {
        cost += ing.cost
      }
    }
    const crustCost = this._crust?.calculateCost() ?? 0
    return cost + crustCost
  }

  describe(): string { return this._pizza.name }
}

export class CustomPizzaItem extends OrderItem {
  private _ingredients: Ingredient[]

  constructor(ingredients: Ingredient[], size: PizzaSize, base: PizzaBase, crust?: Crust) {
    super(size, base, crust)
    this._ingredients = [...ingredients]
  }

  calculateCost(): number {
    const ingCost = this._ingredients.reduce((sum, i) => sum + i.cost, 0)
    const crustCost = this._crust?.calculateCost() ?? 0
    return ingCost + this._base.calculateCost() + crustCost
  }

  describe(): string { return 'Кастомная пицца' }
}

export class CombinedPizzaItem extends OrderItem {
  private _halfA: Pizza
  private _halfB: Pizza

  constructor(halfA: Pizza, halfB: Pizza, size: PizzaSize, base: PizzaBase, crust?: Crust) {
    super(size, base, crust)
    this._halfA = halfA
    this._halfB = halfB
  }

  calculateCost(): number {
    const halfCost = (this._halfA.calculateCost() + this._halfB.calculateCost()) / 2
    const crustCost = this._crust?.calculateCost() ?? 0
    return halfCost + crustCost
  }

  describe(): string { return `${this._halfA.name} / ${this._halfB.name}` }
}

export class PizzaSlice {
  private _position: number
  private _ingredients: Ingredient[]

  constructor(position: number, ingredients: Ingredient[]) {
    this._position = position
    this._ingredients = [...ingredients]
  }

  get position(): number { return this._position }
  get ingredients(): Ingredient[] { return [...this._ingredients] }

  set ingredients(value: Ingredient[]) { this._ingredients = [...value] }

  calculateCost(): number {
    return this._ingredients.reduce((sum, i) => sum + i.cost, 0)
  }
}

export class SlicedPizzaItem extends OrderItem {
  private _slices: PizzaSlice[]

  constructor(slices: PizzaSlice[], size: PizzaSize, base: PizzaBase, crust?: Crust) {
    super(size, base, crust)
    this._slices = slices
  }

  get slices(): PizzaSlice[] { return this._slices }

  calculateCost(): number {
    let totalIngCost = 0
    for (const slice of this._slices) {
      totalIngCost += slice.calculateCost()
    }
    const crustCost = this._crust?.calculateCost() ?? 0
    return totalIngCost + this._base.calculateCost() + crustCost
  }

  describe(): string { return 'Покусочная пицца' }
}

export class Order extends Entity implements IFilterable {
  private _number: number
  private _items: OrderItem[]
  private _comment: string
  private _orderTime: Date
  private _deferredTime: Date | null
  private _guestCount: number

  constructor(number: number, items: OrderItem[], comment: string, guestCount: number, deferredTime?: Date, id?: string) {
    super(id)
    this._number = number
    this._items = [...items]
    this._comment = comment
    this._guestCount = guestCount
    this._orderTime = new Date()
    this._deferredTime = deferredTime ?? null
  }

  get number(): number { return this._number }
  get items(): OrderItem[] { return [...this._items] }
  get comment(): string { return this._comment }
  get guestCount(): number { return this._guestCount }
  get orderTime(): Date { return this._orderTime }
  get deferredTime(): Date | null { return this._deferredTime }

  get totalCost(): number {
    return this._items.reduce((sum, item) => sum + item.calculateCost(), 0)
  }

  matchesFilter(query: string): boolean {
    const q = query.toLowerCase()
    return this._comment.toLowerCase().includes(q)
      || this._items.some(item => item.describe().toLowerCase().includes(q))
  }
}
