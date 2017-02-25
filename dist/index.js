"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    function publish(state, error) {
        $listener.forEach(f => f(state, error));
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
                next($queue[Symbol.iterator](), arguments[0]);
            };
        }
    }
    /**
     * queueのiteratorからtaskを1つ取り出して実行する
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
exports.default = createFlux;
//# sourceMappingURL=index.js.map