import React from 'react';
import Grid from '@material-ui/core/Grid';
import { useTheme } from '@material-ui/core/styles';
import Typography from "@material-ui/core/Typography";
import Card from "@material-ui/core/Card";

function ControlPanelPage(props) {
    const theme = useTheme();

    return( <Grid>
            <Grid container direction={"row"}>
                <Grid item xs={12}>
                    <Card style={{backgroundColor: `${theme.palette.darkTheme.card}`, padding: "15px"}}>
                        <Grid container direction={"column"} alignItems="center" justify={"center"}>
                            <Typography variant="h3">
                                Control Panel Page
                            </Typography>
                        </Grid>
                    </Card>
                </Grid>
            </Grid>
        </Grid>
    )
}


export default ControlPanelPage;