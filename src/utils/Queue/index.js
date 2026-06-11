class Queue {
  constructor() {
    this.endIndex = 0; // 队列尾部
    this.startIndex = 0; // 队列头部
    this.items = {}; // 队列内容
    this.running = false; // 队列执行状态
  }

  // 向队列添加元素
  enqueue(element) {
    this.items[this.endIndex] = element;
    this.endIndex++;
    // 非空队列就执行
    if (!this.isEmpty() && !this.running) {
      this.running = true;
      this.process();
    }
  }

  // 从队列中移除元素
  dequeue() {
    if (this.isEmpty()) {
      return null;
    }
    const result = this.items[this.startIndex];
    delete this.items[this.startIndex];
    this.startIndex++;
    return result;
  }

  // 查看队列的第一个元素
  peek() {
    if (this.isEmpty()) {
      return null;
    }
    return this.items[this.startIndex];
  }

  // 查看队列是否为空
  isEmpty() {
    return this.endIndex - this.startIndex === 0;
  }

  // 查看队列有多少数据
  size() {
    return this.endIndex - this.startIndex;
  }

  // 执行队列
  process() {
    const element = this.dequeue();
    if (element) {
      element()
        .then(() => {
          this.process();
        })
        .catch(() => {
          // console.log(error);
          this.process();
        });
    } else {
      this.running = false;
      this.clear();
    }
  }

  // 清空队列
  clear() {
    this.items = {};
    this.endIndex = 0;
    this.startIndex = 0;
    this.running = false;
  }
}

export default Queue;
