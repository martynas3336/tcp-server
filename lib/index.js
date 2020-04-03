const tls = require('tls');
const Auth = require('./auth');

class Server {
  constructor(props) {
    this.server = {};

    this.authEnabled = false;
    this.auth = {};

    this.sockets = new Set();
    this.port = props.port;
    this.options = props.options;

    this.logCallbacks = props.logCallbacks || [];
  }

  async init() { return new Promise((resolve, reject) => {
    this.log('Initializing server');
    this.server = tls.createServer(this.options);
    return resolve(this);
  })}

  async initHandlers() { return new Promise((resolve, reject) => {
    this.log('Initializing handlers');

    this.server.on('connection', (socket) => {
      this.log(`${socket.remoteAddress} New insecure socket connection`);
    })

    this.server.on('secureConnection', (socket) => {
      socket.setEncoding('utf8');
      this.log(`${socket.remoteAddress} Secured socket connection.`);
      this.sockets.add(socket);

      socket.on('error', (err) => {
        this.log(`${socket.remoteAddress} Socket error: ${err}`);
      });

      socket.on('end', (data) => {
        this.sockets.delete(socket);
        this.log(`${socket.remoteAddress} Socket ended from the other end.`);
        this.log(`${socket.remoteAddress} End data: ${data}`);
      });

      socket.on('close', (err) => {
        this.log(`${socket.remoteAddress} Socket closed.`);
        if(err) {
          this.log(`${socket.remoteAddress} Socket error: ${err}`);
        }
      });

      socket.on('data', () => {});

    });

    this.server.on('error', (error) => {
      this.log(`Error: ${error}`);
    });

    this.server.on('close', () => {
      this.log('Server closed.');
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
    Promise.resolve()
    .then(() => Promise.all(this.logCallbacks.map(cb => cb(msg))))
    .then(resolve)
    .catch(reject)
  })}

  async onLog(cb) { return new Promise((resolve, reject) => {
    this.logCallbacks.push(cb);
    return resolve();
  })}

  async on(action, cb) { return new Promise((resolve, reject) => {
    this.server.on(action, cb);
    return resolve(this);
  })}

  async enableAuth(props) { return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(() => Auth.init({tcp:this, config:props}))
    .then(auth => {
      this.authEnabled = true;
      this.auth = auth;
    })
    .then(resolve)
    .catch(reject)
  })}

  static async init(props) { return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(() => Promise.resolve(new this(props)))
    .then(server => server.init())
    .then(server => server.initHandlers())
    .then(resolve)
    .catch(reject);
  })}
}

module.exports = Server;
