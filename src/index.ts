export default function createFlux<S>(initialState: S, option?: {
    updater?: (s1: S, s2: Partial<S>) => S
}) {

    let $state = initialState;
    let $listener: Function[] = [];
    let $updater = (() => {
        const f1 = option && option.updater;
        const f2 = (s1: S, s2: Partial<S>) => Object.assign({}, s1, s2);
        return f1 || f2;
    })();

    return {
        get listenerCount() {
            return $listener.length;
        },
        getState,
        setState,
        dispatch: usecase, // alias
        usecase,
        subscribe,
    };

    function getState() {
        return $state;
    }

    function setState(state: Partial<S>) {
        $state = $updater($state, state);
        return $state;
    }

    function subscribe(listener: (state: S, event?: string, err?: Error) => void) {
        $listener.push(listener);
        return () => { $listener = $listener.filter(fn => fn !== listener); };
    }

    function publish(state: S, event?: string, error?: Error) {
        $listener.forEach(f => f(state, event, error));
    }

    /*
     * usecase('name').use([f1, f2])(params)
     */
    function usecase(name?: string) {
        let $queue: Function[] = [];

        return { use };

        function use(queue: Q1<S>): R1;
        function use<P>(queue: Q2<S, P>): R2<P>;
        function use(queue: Function[]): R1 | R2<any> {
            $queue = queue;

            /*
                こんなの必要？
                $queue = option.middleware($queue)
            */

            return function run() {
                next($queue[Symbol.iterator](), arguments[0], { name });
            };
        }
    }

    /**
     * queueのiteratorからtaskを1つ取り出して実行する
     */
    function next(i: Iterator<Function>, p: any, opts: {
        name?: string;
        task?: Function
    }) {
        let iResult = opts.task ? { value: opts.task, done: false } : i.next();

        try {
            if (iResult.done) {
                publish($state, opts.name);
                return;
            }

            const result = iResult.value($state, p);

            /* Promise(Like) */
            if (result && typeof result.then === 'function') {
                result.then(
                    (task: Function) => (typeof task === 'function') && next(i, p, { task, name: opts.name }),
                    (e: Error) => publish($state, opts.name, e)
                );
                publish($state, opts.name);
                return;
            }

            if (!iResult.done) {
                result && setState(result);
                next(i, p, { name: opts.name });
                return;
            }

        } catch (e) {
            publish($state, opts.name, e);
        }
    }
}


export type T1<S> = (state: S) => Partial<S> | void;
export type T2<S> = (state: S) => Promise<T1<S>> | void;
export type T3<S, P> = (state: S, params: P) => Partial<S> | void;
export type T4<S, P> = (state: S, params: P) => Promise<T3<S, P>> | void;
export type Q1<S> = (T1<S> | T2<S>)[];
export type Q2<S, P> = (T3<S, P> | T4<S, P>)[];
export type R1 = () => void;
export type R2<P> = (p: P) => void;

/* HelperTypes
-----------------*/
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
    (state: Partial<T>): T;
}

export interface UseCase<S> {
    (name?: string): {
        use: {
            (queue: Q1<S>): R1;
            <P>(queue: Q2<S, P>): R2<P>;
            (queue: Function[]): R1 | R2<any>;
        }
    };
}

export interface Subscribe<T> {
    (listener: (state: T, event?: string, error?: Error) => void): void;
}
