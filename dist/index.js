"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function createStore(initialState, option) {
    let $state = initialState;
    let $listener = [];
    const $enhancer = option && option.enhancer;
    const $updater = (() => {
        const f1 = option && option.updater;
        const f2 = (s1, s2) => Object.assign({}, s1, s2);
        return f1 || f2;
    })();
    return {
        get listenerCount() {
            return $listener.length;
        },
        getState,
        setState,
        dispatch: usecase,
        usecase,
        subscribe,
    };
    /**
     * Get state
     *
     * @returns {S}
     */
    function getState() {
        return $state;
    }
    /**
     * Set state
     * this api depend on updater
     *
     * @param {Partial<S>} state
     * @returns {S} state
     */
    function setState(state) {
        $state = $updater($state, state);
        return $state;
    }
    /**
     * Listen changing of state and exception of transition
     *
     * @param listener
     * @returns {Function} unsubscribe
     */
    function subscribe(listener) {
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
    function publish(state, error) {
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
    function usecase(name) {
        let $queue = [];
        let $run;
        return { use };
        function use(arg) {
            let q = [].concat(arg);
            q = $enhancer ? q.map((t) => $enhancer(name, t)) : q;
            q.forEach(t => $queue.push(t));
            return $run || (() => {
                $run = run;
                $run.use = use;
                return $run;
            })();
            function run() {
                next($queue[Symbol.iterator](), arguments[0]);
            }
            ;
        }
    }
    /**
     * Execute one task from iterator then
     * mutation state and publishing
     *
     * @private
     * @param {Iterator<Function>} i
     * @param {*} p
     * @param {Function} [task]
     * @returns {void}
     */
    function next(i, p, task) {
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
                function resolved(t) {
                    const _t = (typeof t === 'function') && t;
                    next(i, p, _t);
                }
                ;
                function rejected(err) {
                    publish($state, err);
                }
            }
            if (!iResult.done) {
                result && setState(result);
                next(i, p);
                return;
            }
        }
        catch (e) {
            publish($state, e);
        }
    }
}
exports.default = createStore;
//# sourceMappingURL=index.js.map