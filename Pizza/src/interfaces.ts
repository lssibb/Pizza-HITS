export interface IEntity {
    readonly id: string 
    readonly createdAt: Date
    readonly updatedAt: Date
}

export interface ICostCalculable {
    calculateCost(): number
}

export interface ISerializable {
    toJSON(): Record<string, unknown>
}

export interface IFilterable {
    matchesFilter(query: string): boolean
}