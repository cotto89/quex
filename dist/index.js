"use strict";
function createFlux(initialState, option) {
    let $state = initialState;
    let $listener = [];
    let $updater = (() => {
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
        return $state = $updater($state, state);
    }
    function subscribe(listener) {
        $listener.push(listener);
        return () => { $listener = $listener.filter(fn => fn !== listener); };
    }
    function publish(state, event, error) {
        $listener.forEach(f => f(state, event, error));
    }
    /*
     * usecase('name').use([$.f1, $.f2])(params)
     */
    function usecase(name) {
        let $queue = [];
        return { use };
        function use(queue) {
            $queue = queue;
            /*
                こんなの必要？
                $queue = option.middleware($queue)
            */
            /*
              testのためにuseでできたqueueを参照できるようにしてるんだけど、これ必要？
            */
            let $run = run;
            $run._queue = $queue;
            return $run;
        }
        ;
        function run() {
            next($queue[Symbol.iterator](), arguments[0]);
        }
        /**
         * queueのiteratorからtaskを1つ取り出して実行する
         */
        function next(i, p, task) {
            let iResult = task ? { value: task, done: false } : i.next();
            try {
                if (iResult.done) {
                    publish($state, name);
                    return;
                }
                const result = iResult.value($state, p);
                /* Promise(Like) */
                if (result && typeof result.then === 'function') {
                    result.then((t) => next(i, p, t), (e) => publish($state, name, e));
                    publish($state, name);
                    return;
                }
                if (!iResult.done) {
                    result && setState(result);
                    next(i, p);
                    return;
                }
            }
            catch (e) {
                publish($state, name, e);
            }
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createFlux;
//# sourceMappingURL=index.js.map