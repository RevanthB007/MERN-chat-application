import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getRecieverSocketId,io } from "../lib/socket.js";
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password -__v");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error fetching users for sidebar: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// export const sendMessage = async (req, res) => {
//   try {
//     const { text, image } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;
//     let imageUrl;
//     if (image) {
//       const uploadResponse = await cloudinary.uploader.upload(image);
//       imageUrl = uploadResponse.secure_url;
//     }

//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       text,
//       image: imageUrl,
//     });

//     await newMessage.save();


//     const recieverSocketId = getRecieverSocketId(receiverId)
//     if(recieverSocketId){
//       io.to(recieverSocketId).emit("newMessage",newMessage);
//     }

//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.error("Error sending message: ", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

export const sendMessage = async (req, res) => {
  try {
    console.log("=== SEND MESSAGE DEBUG ===");
    console.log("Request body:", req.body);
    console.log("Receiver ID:", req.params.id);
    console.log("Sender ID:", req.user?._id);
    
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    
    // Validate required data
    if (!senderId) {
      console.log("ERROR: No sender ID");
      return res.status(400).json({ message: "Sender ID missing" });
    }
    
    if (!receiverId) {
      console.log("ERROR: No receiver ID");
      return res.status(400).json({ message: "Receiver ID missing" });
    }
    
    if (!text && !image) {
      console.log("ERROR: No text or image");
      return res.status(400).json({ message: "Message content required" });
    }
    
    let imageUrl;
    if (image) {
      console.log("Uploading image to cloudinary...");
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
      console.log("Image uploaded:", imageUrl);
    }

    console.log("Creating new message...");
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    console.log("Saving message to database...");
    await newMessage.save();
    console.log("Message saved successfully");

    // Socket.io emission
    console.log("Checking for receiver socket...");
    const recieverSocketId = getRecieverSocketId(receiverId);
    if (recieverSocketId) {
      console.log("Emitting to receiver socket:", recieverSocketId);
      io.to(recieverSocketId).emit("newMessage", newMessage);
    } else {
      console.log("Receiver not online");
    }

    console.log("Sending response...");
    res.status(201).json(newMessage);
    
  } catch (error) {
    console.error("=== SEND MESSAGE ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};