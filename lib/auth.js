const knex = require('knex');
const bcrypt = require('bcrypt');
const saltRounds = 10;

class Auth {
  constructor(props) {
    this.tcp = props.tcp;
    this.config = props.config;
    this.db = {};
  }

  async updateSchema() {
    this.db = knex(this.config);
    let tableExist = true;
    await this.db.schema.hasTable('users').then((exist) => { tableExist = exist; });
    if(tableExist === false) {
      await this.db.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('username', 512);
        table.string('password', 512);
      })
    }
    return;
  }

  interceptTcp() {
    this.tcp.on('connection', (socket) => {
      this.tcp.log(`Requiring auth for ${socket.remoteAddress}`);
      socket.send(JSON.stringify({message:'Auth required'}));
      socket.send(JSON.stringify({action:'auth'}));

      socket.on('data', (data) => {

        this.tcp.translateData(data).then((data) => {

        }).catch((err) => {
          this.tcp.log(`Error: ${err}`);
          this.tcp.log(`Closing connection because of invalid data format`);
          socket.send({message:'Connection closed because of invalid data format'});
        })
      })
    })
  }

  async addUser(props) {
    const { username, password } = props;
    const hash = bcrypt.hashSync(password, saltRounds);
    await this.db('users').insert({username:username, password:hash});
    return;
  }

  async removeUser(props) {
    const { username } = props;
    await this.db('users').where({username:username}).del();
    return;
  }

  async login(props) {
    const { username, password } = props;
    const users = await this.db.select().table('books').where({username:username});
    const user = users[0];

    if(!!user === false) return false;
    if(bcrypt.compareSync(password, user.password) === false) return false;

    return true;
  }

  static async init(props) {
    const auth = new this(props);
    await auth.updateSchema();
    await auth.interceptTcp();
    return auth;
  }
}

module.exports = Auth;

// TODO:
// FUCK IT GO TO PROMISES. ASYNC AWAIT IS GAY AF
