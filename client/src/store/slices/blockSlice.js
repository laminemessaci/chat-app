import { createSlice } from "@reduxjs/toolkit";

const blockSlice = createSlice({
    name: "block slice",
    initialState: {
        blockedChat: [],
        blockedBy: []
    },
    reducers: {
        blockUser(state, action) {
            state.blockedChat.push(action.payload);
        },

        unBlockUser(state, action) {
            const newArr = state.blockedChat;            
            state.blockedChat = newArr.filter(id => id !== action.payload);
            return state;
        },

        blockEdBy(state, action) {
            state.blockedBy.push(action.payload);
        },

        unBlockEdBy(state, action) {
            const newArr = state.blockedBy;
            state.blockedBy = newArr.filter(id => id !== action.payload);
            return state;
        }
    }
});

export const { blockUser, blockEdBy, unBlockEdBy, unBlockUser } = blockSlice.actions;
export default blockSlice.reducer;