/**
 * create quex store
 *
 * @export
 * @template S
 * @param {S} initialState
 * @param {{
 *     updater?: Updater<S>;
 *     enhancer?: Enhancer<S>
 * }} [option]
 * @returns {Quex<S>}
 */
export default function createStore<S>(initialState: S, option?: {
    updater?: Updater<S>;
    enhancer?: Enhancer<S>;
}): {
    readonly listenerCount: number;
    getState: () => S;
    setState: (state: Partial<S>) => S;
    dispatch: (name?: string | undefined) => {
        use: {
            <S>(task: T1<S>): Use.ReturnType.R1<S>;
            <S, P>(task: T2<S, P>): Use.ReturnType.R2<S, P>;
            <S>(queue: T1<S>[]): Use.ReturnType.R1<S>;
            <S, P>(queue: T2<S, P>[]): Use.ReturnType.R2<S, P>;
        };
    };
    usecase: (name?: string | undefined) => {
        use: {
            <S>(task: T1<S>): Use.ReturnType.R1<S>;
            <S, P>(task: T2<S, P>): Use.ReturnType.R2<S, P>;
            <S>(queue: T1<S>[]): Use.ReturnType.R1<S>;
            <S, P>(queue: T2<S, P>[]): Use.ReturnType.R2<S, P>;
        };
    };
    subscribe: (listener: (state: S, err?: Error | undefined) => void) => () => void;
};
export interface Enhancer<S> {
    (name: string | undefined, task: T1<S> | T2<S, any>): T1<S> | T2<S, any>;
}
export interface Updater<S> {
    (s1: S, s2: Partial<S>): S;
}
export declare type Q1<S> = T1<S>[];
export declare type Q2<S, P> = T2<S, P>[];
export declare type T1<S> = TaskType.T1<S> | TaskType.T2<S>;
export declare type T2<S, P> = TaskType.T3<S, P> | TaskType.T4<S, P>;
export declare namespace TaskType {
    interface T1<S> {
        (state: S): Partial<S> | void;
    }
    interface T2<S> {
        (state: S): Promise<T1<S>> | void;
    }
    interface T3<S, P> {
        (state: S, param: P): Partial<S> | void;
    }
    interface T4<S, P> {
        (state: S, param: P): Promise<T3<S, P>> | void;
    }
}
export declare namespace Use {
    interface U1<S> {
        (queue: Q1<S>): ReturnType.R1<S>;
    }
    interface U2<S, P> {
        (queue: Q2<S, P>): ReturnType.R2<S, P>;
    }
    interface U3<S> {
        (task: T1<S>): ReturnType.R1<S>;
    }
    interface U4<S, P> {
        (task: T2<S, P>): ReturnType.R2<S, P>;
    }
    namespace ReturnType {
        interface R1<S> {
            (): void;
            use: Use.U1<S> & Use.U3<S>;
        }
        interface R2<S, P> {
            (p: P): void;
            use: Use.U2<S, P> & Use.U4<S, P>;
        }
    }
}
