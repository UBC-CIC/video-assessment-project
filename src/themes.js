import { createMuiTheme } from '@material-ui/core/styles';
import orange from '@material-ui/core/colors/orange';

const theme = createMuiTheme({
    palette: {
        primary: {
            main: "#012144",
        },
        secondary: {
            main: orange[500],
        },
        darkTheme: {
            main: "#282c34",
            card: "#4a4f59",
        }
    },
});

export default theme;