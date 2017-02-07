import * as assert from 'assert';
import * as sinon from 'sinon';
import build from './../src/index';

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
    asyncIncrement: async (_: S, count: number) => {
        const n = await Promise.resolve(count);
        return (s: S) => ({
            count: s.count + n
        });
    },
    multiIncrement: (s: S, count: number) => ({
        count: s.count * count
    })
};

// /* Quex
// ------------------------------------ */
const quex = build(initState(), {
    actions: {
        counter: { ...task }
    }
});
beforeEach(() => {
    quex.setState(initState());
});


describe('getState()', () => {
    it('expect return state', () => {
        const s = quex.getState();
        assert.deepEqual(s, { count: 0 });
    });
});


describe('setState()', () => {
    it('expect update state', () => {
        quex.setState({ count: 10 });
        assert.deepEqual(quex.getState(), { count: 10 });
    });
});


describe('subscribe()', () => {
    it('expect receive notification when state is updated', () => {
        const increment = quex.usecase('increment').use($ => [
            $.counter.increment
        ]);
        const spy = sinon.spy();
        const unsubscribe = quex.subscribe(spy);

        increment(10);

        assert(spy.calledWith({ count: 10 }, 'increment', undefined));
        unsubscribe();
    });

    it('expect return unsubscribe()', () => {
        const unsubscribe = quex.subscribe(() => { });
        assert.equal(quex.listenerCount, 1);

        unsubscribe();
        assert.equal(quex.listenerCount, 0);
    });
});

describe('usecase()', () => {
    it('expect be ensured calling of task order', async () => {
        const increment = quex.usecase('increment').use($ => [
            $.counter.increment,
            $.counter.asyncIncrement,
            $.counter.multiIncrement,
        ]);

        const listener = sinon.spy();

        quex.subscribe(listener);

        increment(2);

        await new Promise(resolve => {
            setTimeout(() => {
                // 同期処理のときはpublishされないので、非同期処理に入ったときと、done時の2回呼ばれる
                assert(listener.firstCall.calledWithExactly({ count: 2 }, 'increment', undefined));
                assert(listener.secondCall.calledWithExactly({ count: 8 }, 'increment', undefined));
                // もしtaskが非同期処理の完了を待っていなければ count は 6 になっている
                assert.deepEqual(quex.getState(), { count: 8 });
                resolve();
            });
        });
    });
});
