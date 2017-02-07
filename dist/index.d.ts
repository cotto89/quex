export declare type T1<S> = (state: S) => Partial<S> | void;
export declare type T2<S> = (state: S) => Promise<T1<S>> | void;
export declare type T3<S, P> = (state: S, params: P) => Partial<S> | void;
export declare type T4<S, P> = (state: S, params: P) => Promise<T3<S, P>> | void;
export declare type Q1<S> = (T1<S> | T2<S>)[];
export declare type Q2<S, P> = (T3<S, P> | T4<S, P>)[];
export declare type R1<S> = {
    (): void;
    readonly _queue: Q1<S>;
};
export declare type R2<S, P> = {
    (p: P): void;
    readonly _queue: Q2<S, P>;
};
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
            (queue: Q1<S>): R1<S>;
            <P>(queue: Q2<S, P>): R2<S, P>;
            (queue: Function[]): R1<S> | R2<S, any>;
        };
    };
}
export interface Subscribe<T> {
    (listener: (state: T, event?: string, error?: Error) => void): void;
}
export default function createFlux<S>(initialState: S, option?: {
    updater?: (s1: S, s2: Partial<S>) => S;
}): {
    readonly listenerCount: number;
    getState: () => S;
    setState: (state: Partial<S>) => S;
    dispatch: (name?: string | undefined) => {
        use: {
            (queue: (T1<S> | T2<S>)[]): R1<S>;
            <P>(queue: (T3<S, P> | T4<S, P>)[]): R2<S, P>;
        };
    };
    usecase: (name?: string | undefined) => {
        use: {
            (queue: (T1<S> | T2<S>)[]): R1<S>;
            <P>(queue: (T3<S, P> | T4<S, P>)[]): R2<S, P>;
        };
    };
    subscribe: (listener: (state: S, event?: string | undefined, err?: Error | undefined) => void) => () => void;
};
