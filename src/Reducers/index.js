import { combineReducers } from "redux";
import loginReducer from "./loginReducer";
import appStateReducer from "./appStateReducer";


export default combineReducers({
    loginState: loginReducer,
    appState: appStateReducer,
});