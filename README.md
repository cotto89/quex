# Quex

State Transaction Processor.

Quex is not a Flux that process with Command Pattern but just processor use to state mamagement with `Queue` and `Task`.

## Install

```
npm i -S quex
```

https://www.npmjs.com/package/quex

## Example

```js
import createStore from 'quex';

const store = createStore({ count: 0 });

// Subscribing changing of state.
const unsubscribe = store.subscribe((state, error) => {
	// ...
})

const task = {
    increment: (state count) => ({
        count: s.count + count
    }),

    /*
     * AsyncTask
     *
     * AsyncTask should return TaskFunction, not state,
     * whenever want to update state.
     */
    incrementAsync: async (_, count) => {
        const n = await Promise.resolve(count);
        return (state) => ({
            count: s.count + n
        });
    },

    incrementMulti: (state, count) => ({
        count: s.count * count
    })
};

store.usecase('INCREMENT').use([
	task.increment,
	task.incrementAsync,

	// incrementMult will waiting for the completion of incrementAsync
	task.incrementMulti,

	// currentState will be this
	(state, params) => {
		assert.deepEqual(state, { count: 8 });
		assert.equal(params, 2)
	}
])(2)
```


## API

### `createStore<S>(initialState: S, option?: Option<S>): store`

**return**: `store`.

##### `Option`

```js
interface Option<S> {
    updater?: (currentState: S, nextState: Partial<S>) => S;
    enhancer?: <T>(name: string | undefined, task: T) => T;
}
```

#### `option.updater`

`updater` can customize how to assign currentState and nextState.

**default**: `(s1: S, s2: Partial<S>) => Object.assign({}, s1, s2)`

#### `option.enhancer`

`enhancer` can enhance all task in all queue.

Example: For logging.

```js
const enhancer = (name, task) => (state, params) => {
    const result = task(state, params);
    console.log(`${name}::${task.name}`, result);
    return result
}
```


### `store.getState(): S`

### `store.setState(state: Partial<S>): S`

### `store.subscribe(Listener): () => void`

Subscribing changing of state and transaction error.

**return**: Function that remove listener.

```ts
interface Listener {
	(state: S, error: Error) => void;
}
```

### `store.usecase(name?: string): { use }`

`store.usecaes` copmose a queue by `use`.

**alias**: `store.dispatch()`

**return**: `use()`

```ts
/* Type of Task */
type T1<S> = (state: S) => Partial<S> | void;
type T2<S> = (state: S) => Promise<T1<S>> | void;
type T3<S, P> = (state: S, params: P) => Partial<S> | void;
type T4<S, P> = (state: S, params: P) => Promise<T3<S, P>> | void;

/* Type of Queue */
type Q1<S> = (T1<S> | T2<S>)[];
type Q2<S, P> = (T3<S, P> | T4<S, P>)[];

interface UseCase<S> {
    (name?: string): {
        use: {
            (queue: Q1<S>): () => void;
            <P>(queue: Q2<S, P>): (params: P) => void;
        }
    };
}
```

### `store.listenerCount`

```ts
 readonly listenerCount: number;
```

## Advanced

### About Task

Basicaly, `Task` is a Function that recieve `currentState` and `parameter` then return `nextState`.

State will be change when Task return `nextState`.

#### AsyncTask

**AsyncTask should return `Promise<Function>`, not `Promise<State>`**, whenever want to update state.

```ts
type Task = (state: S, params: P) => S
type AsyncTask = (state: S, params: P) => Promise<Task>
```

### How to process task in the queue

All task in the queue are waiting for completition of previous task even if it is AsyncTask.

 If task throw Error, Queue processing is aborted.


### Transaction aborting

To abort transaction, Throw Error in the Task.


### Timing of publishing new state to listener

#### 1. When last task in the queue is compoleted.

Notification is reduced when state is updated by the sequence of SyncTask in order to reduce rendering of view.

#### 2. When task return Promise.

Otherwise, view will not updated until async process is completed.

### With React.js

If you are using Quex with React.js, you can use [react-redux](https://github.com/reactjs/react-redux) without special settings.

Example:

```js
const store = createStore({count: 0})

<Provider store={store}>
	<Counter>
</Provider>
```

```js
/* mapUseCaseToProps */
const mapUseCaseToProps = (usecase) => ({
	increment: usecase('INCREMENT').use([
 		task.increment
 	])
})

/* connect */
export default connect(mapStateToProps, mapUseCaseToProps)(Counter)
```