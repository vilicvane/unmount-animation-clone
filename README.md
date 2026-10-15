# UnmountAnimationClone (React Component)

A simple utility component that clones the DOM element for animation before it unmounts.

## Installation

```sh
npm install unmount-animation-clone
```

Supports React 18.2 and React 19, including Strict Mode and React 19 ref cleanup.

## Usage

[Live Demo](https://codesandbox.io/s/unmount-animation-clone-ich71)

**Style**

```css
@keyframes animation-enter {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes animation-leave {
  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }
}

.animated-element {
  animation-duration: 0.5s;
  animation-name: animation-enter;
}

.animated-element.unmount {
  /* Unmount animation is required. */
  animation-name: animation-leave;
}
```

**Render**

```jsx
import {useEffect, useState} from 'react';
import {UnmountAnimationClone} from 'unmount-animation-clone';

function App() {
  let [shown, setShown] = useState();

  useEffect(() => {
    let timer = setTimeout(() => setShown(!shown), 2000);

    return () => clearTimeout(timer);
  }, [shown]);

  return shown ? (
    <UnmountAnimationClone>
      <div className="animated-element">hello, world!</div>
    </UnmountAnimationClone>
  ) : (
    <></>
  );
}
```

## API References

### `UnmountAnimationClone`

- `className` class name adds to the DOM element clone for unmount animation, defaults to `unmount`.

> `UnmountAnimationClone` requires one and only one React element as child. If the child is not a DOM element, forward its ref to the outermost DOM element (`forwardRef` in React 18, or a ref prop in React 19).

> Keep the animated element's DOM parent mounted until its exit finishes. The clone stays in that parent; this component does not create a portal or keep an unmounted parent alive.

> The clone is inserted before React removes the original element. Exit callbacks and transition styles run after that commit, so Strict Mode's effect replay does not trigger an exit.

> The clone is removed on `animationend`, `transitionend`, or cancellation. Events must come from the clone itself or a descendant with the `unmount-transition-target` class. An exit animation is required; for reduced motion, keep the animation name and set its duration to `0s` so it still emits an end event. Set `persist` to keep the clone for debugging.

## Development

```sh
npm install
npm test
```

The DOM regression tests live in `src/library/*.test.ts` and use Jest with React 19.1. `npm test` builds them into `bld/library` before running Jest. For React 18 compatibility checks, run the same tests with React 18.3.1, which provides `act` directly from `react`.

## License

MIT License.
