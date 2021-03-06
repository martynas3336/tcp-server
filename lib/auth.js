const knex = require('knex');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const authCallbacks = require('./authCallbacks');
const Message = require('../../tcp-message');

class Auth {
  constructor(props) {
    this.tcp = props.tcp;
    this.config = props.config;
    this.db = {};
    this.cb = [];
  }

  async attachMessageLog() { return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(() => Message.onLog(this.tcp.log.bind(this.tcp)))
    .then(() => resolve(this))
    .catch(reject);
  })}

  async attachAuthCallbacks() { return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(() => authCallbacks(this))
    .then(() => resolve(this))
    .catch(reject);
  })}

  async updateSchema() { return new Promise((resolve, reject) => {
    this.db = knex(this.config);
    Promise.resolve()
    .then(() => this.db.schema.hasTable('users'))
    .then(exist => new Promise((resolve, reject) => {
      if(exist === true) return resolve();
      return resolve(() => this.db.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('username', 512);
        table.string('password', 512);
      }))
    }))
    .then(() => resolve(this))
    .catch(reject);
  })}

  async onAuth(cb) { return new Promise((resolve, reject) => {
    this.cb.push(cb);
    return resolve();
  })}

  async addUser(props) { return new Promise((resolve, reject) => {
    const { username, password } = props;
    if(!!username === false || !!password === false)
    return reject('Add user failed');

    Promise.resolve()
    .then(() => Promise.resolve(bcrypt.hashSync(password, saltRounds)))
    .then(hash => this.db('users').insert({username:username, password:hash}))
    .then(resolve)
    .catch(reject);
  })}

  async deleteUser(props) { return new Promise((resolve, reject) => {
    const { username } = props;
    if(!!username === false)
    return reject('Delete user failed');

    Promise.resolve()
    .then(() => this.db('users').where({username:username}).del())
    .then(resolve)
    .catch(reject);
  })}

  async login(props) { return new Promise((resolve, reject) => {
    const { username, password } = props;
    if(!!username === false || !!password === false)
    return reject('Login failed');

    Promise.resolve()
    .then(() => this.db.select().table('users').where({username:username}))
    .then(rows => new Promise((resolve, reject) => {
      const user = rows[0];
      if(!!user === false) return reject('Invalid user.');
      return resolve(user);
    }))
    .then(user => new Promise((resolve, reject) => {
      if(bcrypt.compareSync(password, user.password) === false) return reject('Invalid user.')
      return resolve(user);
    }))
    .then(resolve)
    .catch(reject);
  })}

  static async init(props) { return new Promise((resolve, reject) => {
    Promise.resolve()
    .then(() => new this(props))
    .then(auth => auth.attachMessageLog())
    .then(auth => auth.updateSchema())
    .then(auth => auth.attachAuthCallbacks())
    .then(resolve)
    .catch(reject);
  })}
}

module.exports = Auth;
