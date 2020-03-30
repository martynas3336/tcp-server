const uuid = require('uuid').v4;

class Message {

  callbacks = {};
  passiveCallbacks = {};

  constructor(props) {
    this.socket = props.socket; // json-socket
    this.data = props.data;
    this.data.resId = props.data.resId || null;
  }

  // send this message
  async send(cb) { return new Promise((resolve, reject) => {
    this.constructor.createCallback(cb).then((id) => {
      this.socket.sendMessage({resId:this.data.resId, reqId:id, data:this.data.data});
    }).catch(reject);
  })}

  // respond to this message
  async respond(data, cb) { return new Promise((resolve, reject) => {

    let _data = {resId:this.resId, reqId:null, data:data};

    Promise.resolve()
    .then(this.constructor.init({socket:this.socket, data:_data}))
    .then((msg) => msg.send(cb))
    .then(resolve)
    .catch(reject)
  })}

  static async init(props) { return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(() => Promise.resolve(new this(props)))
    .then(resolve)
    .catch(reject);
  })}

  static async createCallback(cb) { return new Promise((resolve, reject) => {
    if(!!cb === true && typeof cb === 'function') {
      const id = uuid();
      this.callbacks[id] = cb;
      return resolve(id);
    }
    return resolve(null);
  })}

  static async runCallback(msg) { return new Promise((resolve, reject) => {
    if(!!msg.resId === false) return resolve();
    if(!!Object.prototype.hasOwnProperty.call(this.callbacks, msg.resId) === false) return resolve();

    Promise.resolve(this.callbacks[msg.resId](msg)).then(() => {
      delete this.callbacks[msg.resId];
      return resolve();
    }).catch(reject);
  })}

  static async createPassiveCallback(action, cb) { return new Promise((resolve, reject) => {
    if(!!action === false) throw new Error(`${action} must be a string`);
    if(!!cb === false || typeof cb !== 'function') throw new Error(`${cb} is not a function`);
    if(Object.prototype.hasOwnProperty.call(this.passiveCallbacks, action) === false)
    this.passiveCallbacks[action] = [];
    this.passiveCallbacks.push(cb);
    return resolve();
  })}

  static async runPassiveCallback(msg) { return new Promise((resolve, reject) => {
    if(!!msg.data === false || !!msg.data.action === false) return resolve();
    if(!!Object.prototype.hasOwnProperty.call(this.passiveCallbacks, msg.data.action) === false) return resolve();

    return resolve(Promise.all(this.passiveCallbacks[msg.data.action].map(cb => cb(msg))));
  })}
}
