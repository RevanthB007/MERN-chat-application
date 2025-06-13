import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            console.log("token")
            return res.status(401).json({ message: "Unauthorized access" });
            
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded) {
            console.log("decode")
            return res.status(401).json({ message: "Unauthorized access" });
            

        }

        const user = await User.findById(decoded.userId).select("-password ");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user = user;

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}

