export function getEnumValues<E extends object> (e: E) {
    return Object.values(e).filter((v) => !Object.keys(e).includes(v)) as E[keyof E][]
}
