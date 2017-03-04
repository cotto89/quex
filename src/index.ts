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
    enhancer?: Enhancer<S>
}) {

    let $state = initialState;
    let $listener: Function[] = [];
    const $enhancer = option && option.enhancer;
    const $updater = (() => {
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

    /**
     * Get state
     *
     * @returns {S}
     */
    function getState(): S {
        return $state;
    }

    /**
     * Set state
     * this api depend on updater
     *
     * @param {Partial<S>} state
     * @returns {S} state
     */
    function setState(state: Partial<S>): S {
        $state = $updater($state, state);
        return $state;
    }

    /**
     * Listen changing of state and exception of transition
     *
     * @param listener
     * @returns {Function} unsubscribe
     */
    function subscribe(listener: (state: S, err?: Error) => void) {
        $listener.push(listener);
        return function unsubscribe() {
            $listener = $listener.filter(f => f !== listener);
        };
    }

    /**
     * Publish changing of state to listener
     *
     * @private
     * @param {S} state
     * @param {Error} [error]
     * @returns {void}
     */
    function publish(state: S, error?: Error) {
        $listener.forEach(f => f(state, error));
    }

    /**
     * Compose queue
     *
     * @param {string} [name]
     * @returns {Use}
     * @example
     * usecase('name').use([f1, f2])(param)
     * usecase('name').use(f1).use(f2)(param)
     */
    function usecase(name?: string) {
        let $queue: Function[] = [];
        let $run: any;

        return { use };
        function use<S>(task: T1<S>): Use.ReturnType.R1<S>;
        function use<S, P>(task: T2<S, P>): Use.ReturnType.R2<S, P>;
        function use<S>(queue: Q1<S>): Use.ReturnType.R1<S>;
        function use<S, P>(queue: T2<S, P>[]): Use.ReturnType.R2<S, P>;
        function use(arg: Function | Function[]): Use.ReturnType.R1<S> | Use.ReturnType.R2<S, any> {
            let q = ([] as Function[]).concat(arg);
            $enhancer ? q.map((t: any) => $enhancer(name, t)) : q;
            q.forEach(t => $queue.push(t));

            return $run || (() => {
                $run = run;
                $run.use = use;
                return $run;
            })();

            function run() {
                next($queue[Symbol.iterator](), arguments[0]);
            };
        }
    }

    /**
     * queueのiteratorからtaskを1つ取り出して実行する
     *
     * @private
     * @param {Iterator<Function>} i
     * @param {*} p
     * @param {Function} [task]
     * @returns {void}
     */
    function next(i: Iterator<Function>, p: any, task?: Function) {
        let iResult = task ? { value: task, done: false } : i.next();

        try {
            if (iResult.done) {
                publish($state);
                return;
            }

            const result = iResult.value($state, p);

            /* Promise(Like) */
            if (result && typeof result.then === 'function') {
                result.then(resolved, rejected);
                publish($state);
                return;

                function resolved(t: any) {
                    const _t = (typeof t === 'function') && t;
                    next(i, p, _t);
                };

                function rejected(err: Error) {
                    publish($state, err);
                }
            }

            if (!iResult.done) {
                result && setState(result);
                next(i, p);
                return;
            }

        } catch (e) {
            publish($state, e);
        }
    }
}

export interface Enhancer<S> {
    (name: string | undefined, task: T1<S> | T2<S, any>): T1<S> | T2<S, any>;
}

export interface Updater<S> {
    (s1: S, s2: Partial<S>): S;
}

/* QueueType */
export type Q1<S> = T1<S>[];
export type Q2<S, P> = T2<S, P>[];

/* TaskType */
export type T1<S> = TaskType.T1<S> | TaskType.T2<S>;
export type T2<S, P> = TaskType.T3<S, P> | TaskType.T4<S, P>;
export namespace TaskType {
    export interface T1<S> {
        (state: S): Partial<S> | void;
    }
    export interface T2<S> {
        (state: S): Promise<T1<S>> | void;
    }
    export interface T3<S, P> {
        (state: S, param: P): Partial<S> | void;
    }
    export interface T4<S, P> {
        (state: S, param: P): Promise<T3<S, P>> | void;
    }
}

/* UseType */
export namespace Use {
    export interface U1<S> {
        (queue: Q1<S>): ReturnType.R1<S>;
    }
    export interface U2<S, P> {
        (queue: Q2<S, P>): ReturnType.R2<S, P>;
    }
    export interface U3<S> {
        (task: T1<S>): ReturnType.R1<S>;
    }
    export interface U4<S, P> {
        (task: T2<S, P>): ReturnType.R2<S, P>;
    }
    export namespace ReturnType {
        export interface R1<S> {
            (): void;
            use: Use.U1<S> & Use.U3<S>;
        }
        export interface R2<S, P> {
            (p: P): void;
            use: Use.U2<S, P> & Use.U4<S, P>;
        }
    }
}

