import * as assert from 'assert';
import * as sinon from 'sinon';
import build, { Quex, Enhancer } from './../src/index';

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

/* Quex
------------------------------------ */
let quex: Quex<S>;
beforeEach(() => {
    quex = build(initState());
});


describe('getState()', () => {
    it('return state', () => {
        const s = quex.getState();
        assert.deepEqual(s, { count: 0 });
    });
});


describe('setState()', () => {
    it('update state', () => {
        const nextState = quex.setState({ count: 10 });
        assert.deepEqual(quex.getState(), { count: 10 });
        assert.deepEqual(nextState, quex.getState());
    });
});


describe('subscribe()', () => {
    it('receive notification when state is updated', () => {
        const spy = sinon.spy();
        const unsubscribe = quex.subscribe(spy);

        quex.usecase('increment').use([
            task.increment
        ])(10);

        assert(spy.calledWith({ count: 10 }, 'increment', undefined));
        unsubscribe();
    });

    it('return unsubscribe()', () => {
        const unsubscribe = quex.subscribe(() => { });
        assert.equal(quex.listenerCount, 1);

        unsubscribe();
        assert.equal(quex.listenerCount, 0);
    });
});

describe('usecase()', () => {
    it('expect be ensured calling of task order', async () => {

        const listener = sinon.spy();

        quex.subscribe(listener);

        quex.usecase('increment').use([
            task.increment,
            task.incrementAsync,
            task.incrementMulti
        ])(2);

        await new Promise(resolve => {
            setTimeout(() => {
                // 同期処理のときはpublishされないので、非同期処理に入ったときと、done時の2回呼ばれる
                assert(listener.firstCall.calledWithExactly({ count: 2 }, 'increment', undefined));
                assert(listener.secondCall.calledWithExactly({ count: 8 }, 'increment', undefined));
                assert.equal(listener.callCount, 2);
                // もしtaskが非同期処理の完了を待っていなければ count は 6 になっている
                assert.deepEqual(quex.getState(), { count: 8 });
                resolve();
            });
        });
    });


    it('ignored when task is not a Function', async () => {
        const ignoredPromiseTask = async (s: S, n: number) => {
            assert.deepEqual(s, { count: 2 });
            assert.equal(n, 2);
            return { count: s.count + n };
        };

        const listener = sinon.spy();
        quex.subscribe(listener);

        quex.usecase().use<number>([
            task.increment,
            ignoredPromiseTask,
            task.incrementAsync,
            task.incrementMulti,
        ])(2);

        await new Promise(resolve => {
            setTimeout(() => {
                assert.deepEqual(quex.getState(), { count: 8 });
                resolve();
            });
        });
    });
});


describe('option.updator', () => {
    it('can change how to assign next state', () => {
        const updater = (s1: S, s2: Partial<S>) => s1;
        const updaterSpy = sinon.spy(updater);

        const qx = build(initState(), {
            updater: (updaterSpy as typeof updater)
        });

        qx.usecase().use([
            (s) => ({ count: s.count + 10 })
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

        const qx = build(initState(), { enhancer });

        qx.usecase('INCREMENT').use([
            task.increment
        ])(2);

        assert.deepEqual(qx.getState(), { count: 2 });
    });
});
