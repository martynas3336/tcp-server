const tls = require('tls');
const JsonSocket = require('json-socket');
const Message = require('./message');

class Server {
  constructor(props) {
    this.server = {};

    this.authEnabled = false;
    this.auth = {};

    this.name = props.name || 'tcp Server';

    this.sockets = new Set();
    this.port = props.port;
    this.options = props.options;
  }

  async init() { return new Promise((resolve, reject) => {
    this.server = tls.createServer(this.options);
    return resolve(this);
  })}

  async initHandlers() { return new Promise((resolve, reject) => {
    this.server.on('close', () => {
      this.log('Server closed.');
    });

    this.server.on('connection', (sock) => {
      const socket = new JsonSocket(sock);
      this.log(`${socket._socket.remoteAddress} New socket connection.`);
      this.sockets.add(socket);

      socket.on('error', (err) => {
        this.log(`${socket._socket.remoteAddress} Socket error: ${err}`);
      });

      socket.on('end', (data) => {
        this.sockets.delete(socket);
        this.log(`${socket._socket.remoteAddress} Socket ended from the other end.`);
        this.log(`${socket._socket.remoteAddress} End data: ${data}`);
      });

      socket.on('close', (err) => {
        this.log(`${socket._socket.remoteAddress} Socket closed.`);
        if(err) {
          this.log(`${socket._socket.remoteAddress} Socket error: ${err}`)
        }
      });
    });

    this.server.on('error', (error) => {
      this.log(`Error: ${error}`);
    });
    return resolve(this);
  })}

  async listen() { return new Promise((resolve, reject) => {
    this.server.listen(this.port, () => {
      this.log(`Running at port ${this.port}`);
      return resolve(this);
    })
  })}

  async log(msg) { return new Promise((resolve, reject) => {
    console.log(`> ${this.name}: ${msg}`);
    return resolve(this);
  })}

  async on(action, cb) { return new Promise((resolve, reject) => {
    this.server.on(action, cb);
    return resolve(this);
  })}

  async enableCallback() { return new Promise((resolve, reject) => {
    this.server.on('connection', (sock) => {
      const socket = new JsonSocket(sock);
      socket.on('message', (msg) => {
        Message.runCallback(msg);
      })
    });
    return resolve(this);
  })}

  async enablePassiveCallback() { return new Promise((resolve, reject) => {
    this.server.on('connection', (sock) => {
      const socket = new JsonSocket(sock);
      socket.on('message', (msg) => {
        Message.runPassiveCallback(msg);
      })
    });
    return resolve(this);
  })}

  async send(msg, socket, cb) { return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(Message.init({socket:sockt, data:msg}))
    .then((message) => message.send(cb))
    .then(resolve)
    .catch(reject);
  })}

  static async init(props) { return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(() => Promise.resolve(new this(props)))
    .then((server) => server.init())
    .then((server) => server.initHandlers())
    .then(resolve)
    .catch(reject);
  })}
}

module.exports = Server;
module.exports.Message = Message;
