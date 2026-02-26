export interface IEntity {
  readonly id: string
}

export interface ICostCalculable {
  calculateCost(): number
}

export interface IFilterable {
  matchesFilter(query: string): boolean
}
