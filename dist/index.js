"use strict";
function createFlux(initialState, option) {
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
    function getState() {
        return $state;
    }
    function setState(state) {
        $state = $updater($state, state);
        return $state;
    }
    function subscribe(listener) {
        $listener.push(listener);
        return function unsubscribe() {
            $listener = $listener.filter(f => f !== listener);
        };
    }
    function publish(state, event, error) {
        $listener.forEach(f => f(state, event, error));
    }
    /*
     * usecase('name').use([f1, f2])(params)
     */
    function usecase(name) {
        let $queue = [];
        return { use };
        function use(queue) {
            $queue = $enhancer ? queue.map(t => $enhancer(name, t)) : queue;
            return function run() {
                next($queue[Symbol.iterator](), arguments[0], { name });
            };
        }
    }
    /**
     * queueのiteratorからtaskを1つ取り出して実行する
     */
    function next(i, p, opts) {
        const name = opts.name;
        let iResult = opts.task ? { value: opts.task, done: false } : i.next();
        try {
            if (iResult.done) {
                publish($state, name);
                return;
            }
            const result = (typeof iResult.value === 'function') && iResult.value($state, p);
            /* Promise(Like) */
            if (result && typeof result.then === 'function') {
                result.then(resolved, rejected);
                publish($state, name);
                return;
                function resolved(task) {
                    next(i, p, { task, name });
                }
                ;
                function rejected(err) {
                    publish($state, name, err);
                }
            }
            if (!iResult.done) {
                result && setState(result);
                next(i, p, { name });
                return;
            }
        }
        catch (e) {
            publish($state, name, e);
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createFlux;
//# sourceMappingURL=index.js.map