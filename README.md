# UnmountAnimationClone (React Component)

A simple utility component that clones the DOM element for animation before it unmounts.

## Installation

```ts
yarn add unmount-animation-clone
```

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

> `UnmountAnimationClone` requires one and only one React element as child. If the child is not a DOM element, make sure `forwardRef` is used to forward the ref to the outermost DOM element.

> `UnmountAnimationClone` relies on `animationend` event to remove the animated clone, so unmount animation is required.

## License

MIT License.
