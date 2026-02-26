import { Repository, FilterEngine } from './repository'
import { Ingredient, PizzaBase, Pizza, BaseType, createPizzaBase } from './models'

export class IngredientService {
  private repo = new Repository<Ingredient>()
  private filter = new FilterEngine<Ingredient>()

  getAll(): Ingredient[] { return this.repo.getAll() }
  getById(id: string) { return this.repo.getById(id) }

  add(name: string, cost: number): Ingredient {
    const ing = new Ingredient(name, cost)
    this.repo.add(ing)
    return ing
  }

  update(id: string, name: string, cost: number): void {
    const ing = this.repo.getById(id)
    if (!ing) throw new Error('Ингредиент не найден')
    ing.name = name
    ing.cost = cost
  }

  delete(id: string): void { this.repo.delete(id) }

  search(query: string): Ingredient[] {
    return this.filter.apply(this.repo.getAll(), query)
  }
}

export class PizzaBaseService {
  private repo = new Repository<PizzaBase>()
  private filter = new FilterEngine<PizzaBase>()

  getAll(): PizzaBase[] { return this.repo.getAll() }
  getById(id: string) { return this.repo.getById(id) }


  private getClassicCost(): number {
    const classics = this.repo.getAll().filter(b => b.type === BaseType.Classic)
    if (classics.length === 0) return 0
    return Math.min(...classics.map(b => b.cost))
  }

  add(type: BaseType, name: string, cost: number): PizzaBase {
    const base = createPizzaBase(type, name, cost)


    if (!base.validateCost(this.getClassicCost())) {
      throw new Error('Стоимость основы не должна превышать 120% от классической')
    }

    this.repo.add(base)
    return base
  }

  delete(id: string): void { this.repo.delete(id) }

  search(query: string): PizzaBase[] {
    return this.filter.apply(this.repo.getAll(), query)
  }
}

export class PizzaService {
  private repo = new Repository<Pizza>()
  private filter = new FilterEngine<Pizza>()

  getAll(): Pizza[] { return this.repo.getAll() }
  getById(id: string) { return this.repo.getById(id) }

  add(name: string, ingredients: Ingredient[], base: PizzaBase): Pizza {
    const pizza = new Pizza(name, ingredients, base)
    this.repo.add(pizza)
    return pizza
  }

  delete(id: string): void { this.repo.delete(id) }

  search(query: string): Pizza[] {
    return this.filter.apply(this.repo.getAll(), query)
  }
}
