const setStyleCursor = (wheelZoomerRef, isSpaceDown, isMouseDownRef) => {
  if (isSpaceDown && isMouseDownRef.current) {
    wheelZoomerRef.current.style.cursor = 'grabbing';
  } else if (isSpaceDown) {
    wheelZoomerRef.current.style.cursor = 'grab';
  } else {
    wheelZoomerRef.current.style.cursor = 'auto';
  }
};

export const keyboardEventHandler = (store, wheelZoomerRef, isMouseDownRef) => {
  return {
    onKeyDown: (evt) => {
      if ((evt.code === 'Space' || evt.key === ' ') && !store.isSpaceDown) {
        // evt.stopPropagation();
        // evt.preventDefault(); // REVIEW 会阻止所有位置的空格按下事件，影响正常输入,需改进
        store.setIsSpaceDown(true);
        setStyleCursor(wheelZoomerRef, true, isMouseDownRef);
      }
    },

    onKeyUp: (evt) => {
      if ((evt.code === 'Space' || evt.key === ' ') && store.isSpaceDown) {
        // evt.preventDefault();
        store.setIsSpaceDown(false);
        isMouseDownRef.current = false;
        setStyleCursor(wheelZoomerRef, false, isMouseDownRef);
      }
    },
  };
};

export const drawScreenEventHandler = (
  store,
  wheelZoomerRef,
  isMouseDownRef,
  beforeMouseCoordRef,
  moveScrollByScrollCoord,
) => {
  return {
    onMouseDown: (evt) => {
      if (store.isSpaceDown) {
        isMouseDownRef.current = true;
        beforeMouseCoordRef.current = {
          x: evt.clientX,
          y: evt.clientY,
        };
        setStyleCursor(wheelZoomerRef, store.isSpaceDown, isMouseDownRef);
      }
    },

    onMouseUp: () => {
      if (store.isSpaceDown) {
        isMouseDownRef.current = false;
        setStyleCursor(wheelZoomerRef, store.isSpaceDown, isMouseDownRef);
      }
    },

    onMouseMove: (evt) => {
      if (store.isSpaceDown && isMouseDownRef.current) {
        evt.preventDefault();
        moveScrollByScrollCoord({
          x: beforeMouseCoordRef.current.x - evt.clientX,
          y: beforeMouseCoordRef.current.y - evt.clientY,
        });
        beforeMouseCoordRef.current = {
          x: evt.clientX,
          y: evt.clientY,
        };
      }
    },
  };
};
