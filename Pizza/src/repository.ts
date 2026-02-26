import type { IFilterable } from './interfaces'
import { Entity } from './models'

export class Repository<T extends Entity> {
  private items: Map<string, T> = new Map()

  getAll(): T[] {
    return Array.from(this.items.values())
  }

  getById(id: string): T | undefined {
    return this.items.get(id)
  }

  add(item: T): void {
    this.items.set(item.id, item)
  }

  update(item: T): void {
    this.items.set(item.id, item)
  }

  delete(id: string): boolean {
    return this.items.delete(id)
  }
}

// ===== ФИЛЬТР =====
// Универсальный фильтр для любого типа, который реализует IFilterable

export class FilterEngine<T extends IFilterable> {
  apply(items: T[], query: string): T[] {
    if (!query) return items
    return items.filter(item => item.matchesFilter(query))
  }
}

// ===== КОЛЛЕКЦИЯ (LINQ-подобная) =====
// Обёртка над массивом с удобными методами сортировки и выборки

export class Collection<T> {
  private items: T[]

  constructor(items: T[]) {
    this.items = items
  }


  where(predicate: (item: T) => boolean): Collection<T> {
    return new Collection(this.items.filter(predicate))
  }

  orderBy<K>(selector: (item: T) => K): Collection<T> {
    const sorted = [...this.items].sort((a, b) => {
      const va = selector(a)
      const vb = selector(b)
      return va < vb ? -1 : va > vb ? 1 : 0
    })
    return new Collection(sorted)
  }

  first(): T | undefined {
    return this.items[0]
  }

sum(selector: (item: T) => number): number {
  let result = 0
  for (const item of this.items) {
    result += selector(item)
  }
  return result
}


  toArray(): T[] {
    return [...this.items]
  }
}
