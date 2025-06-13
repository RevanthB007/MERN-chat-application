import {create} from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import {io} from 'socket.io-client';


const BASE_URL=import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";
export const useAuthStore = create((set,get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isCheckingAuth: true,
    onlineUsers: [],
    socket:null,
    checkAuth: async() =>{
        try {
            const res = await axiosInstance.get('/auth/check');
            set({authUser:res.data});
            get().connectSocket();
        } catch (error) {
            console.error("Error checking authentication:", error);
            set({authUser:null});
        }
        finally{
            set({isCheckingAuth:false});
        }
    },

    signUp: async(data) => {
        set({isSigningUp: true});
        try {
            const res = await axiosInstance.post('/auth/signup', data);
            set({authUser:res.data});
            toast.success("Account created successfully");
            get().connectSocket()

        } catch (error) {
            console.error("Error creating account:", error);
            toast.error("Error creating account: " + (error.response?.data?.message || error.message));
        }
        finally{
            set({isSigningUp: false});
        }
    },

    logout: async() =>{
        try {
            await axiosInstance.post('/auth/logout');
            set({authUser:null});
            toast.success("Logged out successfully");
            get().disconnectSocket()
        } catch (error) {
            toast.error("Error logging out: " + (error.response?.data?.message || error.message));
            console.log("Error logging out:", error);
        }
    },

    login: async (data) => {
        set({isLoggingIn: true});
        try {
            const res =await axiosInstance.post("/auth/login",data);
            set({authUser:res.data});
            toast.success("Logged in successfully");
            get().connectSocket()

        } catch (error) {
            toast.error("Error logging in: " + (error.response?.data?.message || error.message));
        }
        finally{
            set({isLoggingIn: false});
        }
    },

    updateProfile:async(data) => {
        set({isUpdatingProfile: true});
        try {
            const res = await axiosInstance.put('/auth/update-profile', data);
            set({authUser: res.data});
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Error updating profile: " + (error.response?.data?.message || error.message));
        }
        finally{
            set({isUpdatingProfile: false});
        }
    },

    connectSocket:()=>{
        const {authUser} = get();
        if(!authUser || get().socket?.connected) return
        const socket = io(BASE_URL, {
            query: {
                userId: authUser._id
            },
        });

        socket.connect()
        set({socket:socket})
        socket.on("getOnlineUsers",(userIds)=>{
            set({onlineUsers:userIds})
        })
    },


    disconnectSocket: () => {
       if(get().socket?.connected) get().socket.disconnect(); 
    }
    

})
)