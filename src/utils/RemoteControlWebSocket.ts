const HEARTBEAT_INTERVAL = 30000; // 心跳间隔（ms）
const HEARTBEAT_TIMEOUT = 60000; // 心跳超时时间（ms）
const RECONNECT_DELAY_BASE = 1.5; // 重连延迟时间的基数
const RECONNECT_DELAY_MAX = 30; // 重连延迟时间的上限

interface RemoteControlWebSocketOptions {
  onMessage?: (msg: string) => void; // 被控端收到消息回调函数
  targetAppId?: string; // 目标应用ID
}

/**
 * 远程控制 webSocket
 */
class RemoteControlWebSocket {
  static instance: RemoteControlWebSocket = null;

  url: string; // ws 地址

  options: RemoteControlWebSocketOptions; // 其他可选项

  socket: WebSocket = null;

  reconnecting: boolean = false; // 重连中

  reconnectTimes: number = 1; // 尝试重连次数

  heartbeatTimer: ReturnType<typeof setTimeout>;

  autoReconnectTimer: ReturnType<typeof setTimeout>;

  reconnectTimer: ReturnType<typeof setTimeout>;

  private constructor(url: string, options: RemoteControlWebSocketOptions = {}) {
    this.url = url;
    this.options = options;
    this.connect();
  }

  static getInstance(url: string, options: RemoteControlWebSocketOptions = {}) {
    if (!this.instance) {
      this.instance = new RemoteControlWebSocket(url, options);
    }
    return this.instance;
  }

  // 创建连接
  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.addEventListener('open', () => {
      this.heartbeat();
      this.reconnectTimes = 1;
    });

    this.socket.addEventListener('message', (event) => {
      this.handleMessage(event);
    });

    this.socket.addEventListener('error', (e) => {
      console.error('ws connect error:', e);
      // 当websocket的连接由于一些错误事件的发生 (例如无法发送一些数据) 而被关闭时，自动重连
      // 当建立连接失败时，自动重连
      if (this.socket.readyState === WebSocket.CLOSED) {
        this.reconnect();
      }
    });

    this.socket.addEventListener('close', (e) => {
      console.error('ws connect closed:', e);
      // 非正常关闭，自动重连
      if (e.code !== 1000) {
        this.reconnect();
      }
    });
  }

  // 处理接收到的消息
  handleMessage(event: MessageEvent<any>) {
    try {
      const data = JSON.parse(event.data);
      switch (data.messageType) {
        case 'message': {
          if (this.options.onMessage) this.options.onMessage(data.jsonConfig);
          break;
        }
        case 'ack': {
          // 收到应答消息，则取消自动重连
          clearTimeout(this.autoReconnectTimer);
          break;
        }
        default: {
          break;
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  // 发送控制报文
  sendMessage(payload: Record<string, any>) {
    if (this.socket.readyState !== WebSocket.OPEN) {
      console.error('ws connect not open');
      return;
    }
    const data = {
      requestId: this.getRequestId(),
      messageType: 'message',
      targetAppId: this.options.targetAppId,
      jsonConfig: JSON.stringify(payload),
    };
    this.socket.send(JSON.stringify(data));
  }

  // 发送心跳报文
  heartbeat() {
    // 每隔30s向后端发送心跳报文，如果60s后没有收到后端的ack应答消息，自动重新连接
    this.socket.send(
      JSON.stringify({
        requestId: this.getRequestId(),
        messageType: 'keepAlive',
      }),
    );

    this.heartbeatTimer = setTimeout(() => {
      this.heartbeat();
    }, HEARTBEAT_INTERVAL);

    this.autoReconnectTimer = setTimeout(() => {
      this.reconnect();
    }, HEARTBEAT_TIMEOUT);
  }

  // 尝试重连
  reconnect() {
    if (this.reconnecting) return;
    this.reconnecting = true;
    this.close();
    this.reconnectTimer = setTimeout(() => {
      this.connect();
      this.reconnecting = false;
      this.reconnectTimes++;
    }, this.getReconnectDelay());
  }

  // 关闭
  close() {
    this.socket.close();
    clearTimeout(this.heartbeatTimer);
    clearTimeout(this.autoReconnectTimer);
    clearTimeout(this.reconnectTimer);
  }

  getRequestId() {
    const r = Math.floor(Math.random() * 1000000);
    return Date.now().toString() + r;
  }

  // 获取重连延迟时间
  getReconnectDelay() {
    // 初始值1.5s，随着尝试重连次数增加而指数级增长，最大30s
    let delay = Math.floor(RECONNECT_DELAY_BASE ** this.reconnectTimes);
    if (delay > RECONNECT_DELAY_MAX) delay = RECONNECT_DELAY_MAX;
    return delay * 1000;
  }
}

export default RemoteControlWebSocket;
