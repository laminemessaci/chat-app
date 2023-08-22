const DeleteMSG = require("../schema/DeleteMSG");
const collectedMSG = require("../schema/UnsendMSG");
const UpdateMSG = require("../schema/UpdateMSG");
const UserSchema = require("../schema/UserSchema");

const users = {}; // For storing users with the key of socket id and the value of their mondoDB id 

// Finding the object key with his value
function getKeyByValue(value) {
  return Object.keys(users).find(key => users[key] === value);
};

function socketServer(io) {
  io.on("connection", socket => {

    // When a user newly join this app
    socket.on("user-signup", () => {
      socket.broadcast.emit("new-user-signup");
    });

    // when a new user online throwing a function named "user-join"
    socket.on("user-online", async (userId) => {
      users[socket.id] = userId;
      socket.broadcast.emit("new-user-online", userId);
      socket.join(userId); // Join the users on their specified rooms with the name of their id's

      // Checking if user has some pending messages and pending deleted message or updated messages or not
      const messages = await collectedMSG.find({ reciverId: userId });
      const deleteMessages = await DeleteMSG.find({ reciverId: userId });
      const updateMessages = await UpdateMSG.find({ reciverId: userId });

      // If user have any messages
      if (messages) {
        socket.emit("get-unsend-msg", messages);
      };

      // If user have some message to be deleted
      if (deleteMessages) socket.emit("delete-msg-db", deleteMessages);
      // If user have some message to be updated
      if (updateMessages) socket.emit("update-msg-db", updateMessages);
    });

    // Getting the id of already connected user
    socket.emit("get-online-id", Object.values(users));

    // When send msg emittied, emiting recive msg function
    socket.on("send_msg", async ({ text, id, msgId }) => {
      // Checking if the user online or not
      let objectKey = getKeyByValue(id);
      if (objectKey) {
        io.to(id).emit("recive-msg", { id: users[socket.id], msg: text, msgId });
      }
      else { // If user is offline the saving the messages on database
        try {
          const newMSG = new collectedMSG({
            senderId: users[socket.id],
            reciverId: id,
            message: text,
            msgId
          });
          await newMSG.save();
        }
        catch (error) {
          console.error('Error saving message:', error);
        };
      };
    });

    // If user recived unsend messages then deleting the messages from DB
    socket.on("recived-unsend-msg", async (msgId) => {
      await collectedMSG.findByIdAndDelete(msgId);
    });

    // If user recived updated messages then deleting the messages from DB
    socket.on("recived-update-msg", async (msgId) => {
      await UpdateMSG.findByIdAndDelete(msgId);
    });

    // If user recived deleted messages then deleting the messages from DB
    socket.on("recived-deleted-msg", async (msgId) => {
      await DeleteMSG.findByIdAndDelete(msgId);
    });

    // Getting the updates and broadcast it to the other users
    socket.on("user-update-client", obj => {
      socket.broadcast.emit("user-update-server", obj);
    });

    // When someone update message
    socket.on("update-msg", async (obj) => {
      // Checking if the user online or not
      let objectKey = getKeyByValue(obj.reciverId);
      if (objectKey) {
        io.to(obj.reciverId).emit("update-msg-server", obj);
      }
      else {
        const { senderId, reciverId, msgId, newContent } = obj;
        const newUpdate = new UpdateMSG({
          senderId,
          reciverId,
          msgId,
          newContent
        });

        await newUpdate.save();
      };
    });

    // When someone delete message
    socket.on("delete-msg", async (obj) => {
      // Checking if the user online or not
      let objectKey = getKeyByValue(obj.reciverId);
      if (objectKey) {
        io.to(obj.reciverId).emit("delete-msg-server", obj);
      }
      else {
        const { senderId, reciverId, msgId } = obj;
        const newDelete = new DeleteMSG({
          senderId,
          reciverId,
          msgId
        });

        await newDelete.save();
      };
    });

    socket.on("send-image", async (obj) => {
      // Checking if the user online or not
      let objectKey = getKeyByValue(obj.id);
      if (objectKey) {
        io.to(obj.id).emit("recive-image", { id: users[socket.id], img: obj.img, msgId: obj.msgId });
      }
      else {
        // If user is offline the saving the messages on database
        try {
          const newMSG = new collectedMSG({
            senderId: users[socket.id],
            reciverId: obj.id,
            image: obj.img,
            msgId: obj.msgId
          });
          await newMSG.save();
        }
        catch (error) {
          console.error('Error saving message:', error);
        };
      };
    });

    // When a user updates his profile-picture
    socket.on("profile-picture-update", () => {
      socket.broadcast.emit("user-update-server");
    });

    // When user blocked a user updating their blocks
    socket.on("blocked", async (id) => {
      const userId = users[socket.id];
      const emiterUser = await UserSchema.findById(userId).select("block");
      const reciverUser = await UserSchema.findById(id).select("block");

      const emiterBlock = {
        block: {
          blockedChat: [...emiterUser.block.blockedChat, id],
          blockedBy: [...emiterUser.block.blockedBy]
        }
      };

      const reciverBlock = {
        block: {
          blockedChat: [...reciverUser.block.blockedChat],
          blockedBy: [...reciverUser.block.blockedBy, userId]
        }
      };

      io.to(id).emit("you-are-blocked", userId);

      try {
        await UserSchema.findByIdAndUpdate(userId, { $set: emiterBlock }, { new: true });
        await UserSchema.findByIdAndUpdate(id, { $set: reciverBlock }, { new: true });
      }
      catch (error) {
        console.log(error);
      };
    });

    // When user unblock a user updating their blocks
    socket.on("unblock", async (id) => {
      const userId = users[socket.id];
      const emiterUser = await UserSchema.findById(userId).select("block");
      const reciverUser = await UserSchema.findById(id).select("block");

      // Removing the ids from the arrray
      const newEmiterBlockedChat = emiterUser.block.blockedChat.map(storedId => storedId !== id);
      const newReciverBlockedChat = reciverUser.block.blockedChat.map(storedId => storedId !== userId);

      const emiterBlock = {
        block: {
          blockedChat: [newEmiterBlockedChat],
          blockedBy: [...emiterUser.block.blockedBy]
        }
      };

      const reciverBlock = {
        block: {
          blockedChat: [...reciverUser.block.blockedChat],
          blockedBy: [newReciverBlockedChat]
        }
      };

      io.to(id).emit("you-are-unblocked", userId);

      try {
        await UserSchema.findByIdAndUpdate(userId, { $set: emiterBlock }, { new: true });
        await UserSchema.findByIdAndUpdate(id, { $set: reciverBlock }, { new: true });
      }
      catch (error) {
        console.log(error);
      };
    });

    // When user disconnect 
    socket.on("disconnect", () => {
      socket.broadcast.emit("user-offline", users[socket.id]);
      delete users[socket.id];
    });
  });
};

module.exports = socketServer;
