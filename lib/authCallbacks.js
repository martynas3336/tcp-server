const Message = require('@dealerproductions/tcp-message');
module.exports = auth => new Promise((resolve, reject) => {

  auth.tcp.server.on('secureConnection', (socket) => {

    // handle login attempt
    Message.onAction(socket, 'login', message => new Promise((resolve, reject) => {
      const { username, password } = message.packet.data;
      if(!!username === false || password === false) {
        message.respond({action:'login_failed'});
        return resolve();
      }
      Promise.resolve()
      .then(() => auth.login({username, password}))
      .then(() => Promise.all(auth.cb.map(cb => cb(message.socket))))
      .then(() => message.respond({action:'login_success'}))
      .then(resolve)
      .catch((err) => { message.respond({action:'login_failed'})})
      .then(resolve)
      .catch(reject);
    }))

    // send login request
    auth.tcp.log(`Requiring auth for ${socket.remoteAddress}`);
    Promise.resolve()
    .then(() => Message.send(socket, {action:'login_request'}))
    .then(() => { auth.tcp.log(`Auth request for ${socket.remoteAddress} sent.`)})
    .then(resolve)
    .catch(reject);
  })

  // on add user action
  auth.onAuth((socket) => new Promise((resolve, reject) => {
    Message.onAction(socket, 'add_user', message => new Promise((resolve, reject) => {
      const { username, password } = message.packet.data;
      if(!!username === false || !!password === false) {
        message.respond({action:'add_user_failed'});
        return resolve();
      }

      Promise.resolve()
      .then(() => auth.addUser({username, password}))
      .then(() => message.respond({action:'add_user_success'}))
      .then(resolve)
      .catch(() => message.respond({action:'add_user_failed'}))
      .then(resolve)
      .catch(resolve);
    }))
    return resolve();
  }))

  // on delete user action
  auth.onAuth((socket) => new Promise((resolve, reject) => {
    Message.onAction(socket, 'delete_user', message => new Promise((resolve, reject) => {
      const { username } = message.packet.data;
      if(!!username === false) {
        message.respond({action:'delete_user_failed'});
        return resolve();
      }

      Promise.resolve()
      .then(() => auth.deleteUser({username}))
      .then(() => message.respond({action:'delete_user_success'}))
      .then(resolve)
      .catch(() => message.respond({action:'add_user_failed'}))
      .then(resolve)
      .catch(reject);
    }))
    return resolve();
  }))

  return resolve(auth);
})
