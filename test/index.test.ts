import * as assert from 'assert';
import * as sinon from 'sinon';
import createStore, { Enhancer } from './../src/index';

/* State
------------------------------ */
interface S {
    count: number;
}

const initState = (): S => ({
    count: 0
});

/* Task
---------------------------------*/
const task = {
    increment: (s: S, count: number) => ({
        count: s.count + count
    }),
    incrementAsync: async (_: S, count: number) => {
        const n = await Promise.resolve(count);
        return (s: S) => ({
            count: s.count + n
        });
    },
    incrementMulti: (s: S, count: number) => ({
        count: s.count * count
    })
};

/* Store
------------------------------------ */
let store = createStore(initState());
beforeEach(() => {
    store = createStore(initState());
});


describe('getState()', () => {
    it('return state', () => {
        const s = store.getState();
        assert.deepEqual(s, { count: 0 });
    });
});


describe('setState()', () => {
    it('update state', () => {
        const nextState = store.setState({ count: 10 });
        assert.deepEqual(store.getState(), { count: 10 });
        assert.deepEqual(nextState, store.getState());
    });
});

describe('subscribe()', () => {
    it('receive notification when state is updated', () => {
        const spy = sinon.spy();
        const unsubscribe = store.subscribe(spy);
        store.usecase('increment').use(task.increment)(10);
        assert(spy.calledWith({ count: 10 }, undefined));
        unsubscribe();
    });

    it('return unsubscribe()', () => {
        const unsubscribe = store.subscribe(() => { });
        assert.equal(store.listenerCount, 1);
        unsubscribe();
        assert.equal(store.listenerCount, 0);
    });
});

describe('usecase()', () => {
    let spy = sinon.spy();
    beforeEach(() => {
        spy.reset();
    });

    context('use(queue)', () => {
        it('update state', () => {
            store.usecase().use([
                task.increment,
                task.incrementMulti
            ])(2);

            assert.deepEqual(store.getState(), { count: 4 });
        });
    });

    context('use(task).use(task)', () => {
        it('update state', () => {
            store.usecase()
                .use(task.increment)
                .use(task.incrementMulti)(2);

            assert.deepEqual(store.getState(), { count: 4 });
        });
    });

    it('ensured calling task order', async () => {
        store.subscribe(spy);
        store.usecase()
            .use(task.increment)
            .use([task.incrementAsync, task.incrementMulti])(2);

        await new Promise(resolve => {
            setTimeout(() => {
                // 同期処理のときはpublishされないので、非同期処理に入ったときと、done時の2回呼ばれる
                assert(spy.firstCall.calledWithExactly({ count: 2 }, undefined));
                assert(spy.secondCall.calledWithExactly({ count: 8 }, undefined));
                assert.equal(spy.callCount, 2);
                // もしtaskが非同期処理の完了を待っていなければ count は 6 になっている
                assert.deepEqual(store.getState(), { count: 8 });
                resolve();
            });
        });
    });

    it('is ignored when task is not a Function', async () => {
        const ignoredPromiseTask = async (s: S, n: number) => {
            assert.deepEqual(s, { count: 2 });
            assert.equal(n, 2);
            return { count: s.count + n };
        };

        store.usecase().use([
            task.increment,
            ignoredPromiseTask,
            task.incrementAsync,
            task.incrementMulti,
        ])(2);

        await new Promise(resolve => {
            setTimeout(() => {
                assert.deepEqual(store.getState(), { count: 8 });
                resolve();
            });
        });
    });
});

describe('option.updator', () => {
    it('can change how to assign next state', () => {
        const updater = (s1: S, s2: Partial<S>) => s1;
        const updaterSpy = sinon.spy(updater);

        const qx = createStore(initState(), {
            updater: (updaterSpy as typeof updater)
        });
        qx.usecase().use([
            (s: S) => ({ count: s.count + 10 })
        ])();

        assert(updaterSpy.calledWith({ count: 0 }, { count: 10 }));
        assert.deepEqual(qx.getState(), { count: 0 });
    });
});


describe('option.enhancer', () => {
    it('can enhance task', () => {
        const enhancer: Enhancer<S> = (name: string, _task: Function) => {
            assert.equal(name, 'INCREMENT');
            assert.equal(_task.name, 'increment');
            return (s: S, p: any) => {
                assert.deepEqual(s, { count: 0 });
                assert.equal(p, 2);
                return _task(s, p);
            };
        };

        const qx = createStore(initState(), { enhancer });
        qx.usecase('INCREMENT').use([
            task.increment
        ])(2);

        assert.deepEqual(qx.getState(), { count: 2 });
    });
});

