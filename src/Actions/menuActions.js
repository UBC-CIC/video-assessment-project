// ===================================---CHANGE SIDE MENU STATE---=======================================
// Updates the sidebar menu state of the application
export const updateMenuState = (payload) => {
    return (dispatch) => {
        dispatch({ type: "SET_MENU_STATE", payload: payload });
    }
}