const initialState = {
    showSideBar: false,
};


const appStateReducer = (currentState = initialState, action) => {
    let newState = currentState;
    switch(action.type) {
        case "SET_MENU_STATE": {
            return {
                showSideBar: action.payload
            }
        }
        default:
            return newState
    }
}

export default appStateReducer;