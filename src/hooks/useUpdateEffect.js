import { useEffect, useRef } from 'react';

function useUpdateEffect(effect, deps) {
  const isMount = useRef(false);
  const effectRef = useRef(effect);
  effectRef.current = effect;
  useEffect(() => {
    if (!isMount.current) {
      isMount.current = true;
    } else {
      return effectRef.current();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export default useUpdateEffect;
