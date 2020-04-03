// controllers

// const Message = require('@dealerproductions/tcp-message');
const Message = require('../../tcp-message');
module.exports = auth => {

  auth.tcp.server.on('secureConnection', (socket) => {

    // handle login attempt
    Message.onAction(socket, 'login', async message => {
      const { username, password } = message.packet.data;
      Promise.resolve()
      .then(() => auth.login({username, password}))
      .then(() => Promise.all(auth.cb.map(cb => cb(socket))))
      .then(() => {
        auth.tcp.log(`Auth successful for ${socket.remoteAddress}`);
        Message.send(socket, {action:'message', data:{message:'Logged in successfully.'}});
        message.respond({action:'login_success'});
      })
      .catch(err => {
        Message.send(socket, {action:'message', data:{message:'Login failed.'}});
        message.respond({action:'login_failed'});
        auth.tcp.log(err);
      })
    })

    // send login request
    auth.tcp.log(`Requiring auth for ${socket.remoteAddress}`);
    Message.send(socket, {action:'login_request'});
    auth.tcp.log(`Auth request for ${socket.remoteAddress} sent.`);
  })

  // on add user action
  auth.onAuth(socket => {
    Message.onAction(socket, 'add_user', message => {
      const { username, password } = message.packet.data;

      Promise.resolve()
      .then(() => auth.addUser({username, password}))
      .then(() => {
        Message.send(socket, {action:'message', data:{message:'Users updated.'}});
        message.respond({action:'add_user_success'})
      })
      .catch(err => {
        Message.send(socket, {action:'message', data:{message:'Users update failed.'}});
        message.respond({action:'add_user_failed'});
        auth.tcp.log(err);
      })
    })
  })

  // on delete user action
  auth.onAuth(socket => {
    Message.onAction(socket, 'delete_user', message => {
      const { username } = message.packet.data;

      Promise.resolve()
      .then(() => auth.deleteUser({username}))
      .then(() => {
        Message.send(socket, {action:'message', data:{message:'Users updated.'}});
        message.respond({action:'delete_user_success.'});
      })
      .catch(err => {
        Message.send(socket, {action:'message', data:{message:'Users update failed.'}});
        message.respond({action:'delete_user_failed.'});
        auth.tcp.log(err);
      })
    })
  })
}
