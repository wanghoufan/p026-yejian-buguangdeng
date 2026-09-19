export type TrailingThrottle<A extends unknown[]> = {
  /** 记录一次调用；窗口内多次调用只保留最后一次（trailing），窗口结束补发。 */
  call: (...args: A) => void;
  /** 立即补发挂起的最后一次调用（无挂起则不发）。拖动结束时用，保证最终值必达、thumb 不回跳。 */
  flush: () => void;
  /** 丢弃挂起的调用与定时器（卸载/取消时用）。 */
  cancel: () => void;
};

/**
 * 纯 trailing 节流器（无依赖、可单测）。
 * P0 真机闪跳：拖动每帧都 dispatch 会让 Context 反复重渲染，
 * 这里把频率压到窗口一次；flush() 保证 touchEnd 的最终值同步落地。
 */
export function createTrailingThrottle<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
): TrailingThrottle<A> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: A | null = null;

  const fire = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (pending === null) return;
    const args = pending;
    pending = null;
    fn(...args);
  };

  return {
    call(...args: A) {
      pending = args;
      if (timer !== null) return;
      timer = setTimeout(fire, ms);
    },
    flush: fire,
    cancel() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      pending = null;
    },
  };
}
