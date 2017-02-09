export default function createFlux<S>(initialState: S, option?: {
    updater?: (s1: S, s2: Partial<S>) => S;
}): {
    readonly listenerCount: number;
    getState: () => S;
    setState: (state: Partial<S>) => S;
    dispatch: (name?: string | undefined) => {
        use: {
            (queue: (T1<S> | T2<S>)[]): R1;
            <P>(queue: (T3<S, P> | T4<S, P>)[]): R2<P>;
        };
    };
    usecase: (name?: string | undefined) => {
        use: {
            (queue: (T1<S> | T2<S>)[]): R1;
            <P>(queue: (T3<S, P> | T4<S, P>)[]): R2<P>;
        };
    };
    subscribe: (listener: (state: S, event?: string | undefined, err?: Error | undefined) => void) => () => void;
};
export declare type T1<S> = (state: S) => Partial<S> | void;
export declare type T2<S> = (state: S) => Promise<T1<S>> | void;
export declare type T3<S, P> = (state: S, params: P) => Partial<S> | void;
export declare type T4<S, P> = (state: S, params: P) => Promise<T3<S, P>> | void;
export declare type Q1<S> = (T1<S> | T2<S>)[];
export declare type Q2<S, P> = (T3<S, P> | T4<S, P>)[];
export interface R1 {
    (): void;
}
export interface R2<P> {
    (p: P): void;
}
export interface Quex<S> {
    readonly listenerCount: number;
    getState: GetState<S>;
    setState: SetState<S>;
    subscribe: Subscribe<S>;
    dispatch: UseCase<S>;
    usecase: UseCase<S>;
}
export interface GetState<T> {
    (): T;
}
export interface SetState<T> {
    (state: Partial<T>): void;
}
export interface UseCase<S> {
    (name?: string): {
        use: {
            (queue: Q1<S>): R1;
            <P>(queue: Q2<S, P>): R2<P>;
            (queue: Function[]): R1 | R2<any>;
        };
    };
}
export interface Subscribe<T> {
    (listener: (state: T, event?: string, error?: Error) => void): void;
}
