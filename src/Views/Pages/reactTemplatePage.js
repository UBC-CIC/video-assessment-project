import React from 'react';
import Grid from '@material-ui/core/Grid';
import { useTheme } from '@material-ui/core/styles';
import Card from "@material-ui/core/Card";
import logo from "../../logo.svg";

function ReactTemplatePage(props) {
    const theme = useTheme();

    return( <Grid>
            <Grid container direction={"row"} spacing={1}>
                <Grid item xs={6}>
                    <Card style={{backgroundColor: `${theme.palette.darkTheme.card}`, padding: "15px"}}>
                        <Grid container direction={"column"} alignItems="center" justify={"center"}>
                            <Grid item xs={12}>
                                <img src={logo} className="App-logo" alt="logo" />
                            </Grid>
                            <Grid item xs={12}>
                                <p>
                                    Edit <code>src/App.js</code> and save to reload.
                                </p>
                            </Grid>
                            <Grid item xs={12}>
                                <a
                                    className="App-link"
                                    href="https://reactjs.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Learn React
                                </a>
                            </Grid>
                        </Grid>
                    </Card>
                </Grid>

                <Grid item xs={6}>
                    <Card style={{backgroundColor: `${theme.palette.darkTheme.card}`, padding: "15px"}}>
                        <Grid container direction={"column"} alignItems="center" justify={"center"}>
                            <Grid item xs={12}>
                                <img src={logo} className="App-logo" alt="logo" />
                            </Grid>
                            <Grid item xs={12}>
                                <p>
                                    Edit <code>src/App.js</code> and save to reload.
                                </p>
                            </Grid>
                            <Grid item xs={12}>
                                <a
                                    className="App-link"
                                    href="https://reactjs.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Learn React
                                </a>
                            </Grid>
                        </Grid>
                    </Card>
                </Grid>
            </Grid>
            <Grid container direction={"row"} spacing={1} style={{paddingTop: "4px"}}>
                <Grid item xs={6}>
                    <Card style={{backgroundColor: `${theme.palette.darkTheme.card}`, padding: "15px"}}>
                        <Grid container direction={"column"} alignItems="center" justify={"center"}>
                            <Grid item xs={12}>
                                <img src={logo} className="App-logo" alt="logo" />
                            </Grid>
                            <Grid item xs={12}>
                                <p>
                                    Edit <code>src/App.js</code> and save to reload.
                                </p>
                            </Grid>
                            <Grid item xs={12}>
                                <a
                                    className="App-link"
                                    href="https://reactjs.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Learn React
                                </a>
                            </Grid>
                        </Grid>
                    </Card>
                </Grid>

                <Grid item xs={6}>
                    <Card style={{backgroundColor: `${theme.palette.darkTheme.card}`, padding: "15px"}}>
                        <Grid container direction={"column"} alignItems="center" justify={"center"}>
                            <Grid item xs={12}>
                                <img src={logo} className="App-logo" alt="logo" />
                            </Grid>
                            <Grid item xs={12}>
                                <p>
                                    Edit <code>src/App.js</code> and save to reload.
                                </p>
                            </Grid>
                            <Grid item xs={12}>
                                <a
                                    className="App-link"
                                    href="https://reactjs.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Learn React
                                </a>
                            </Grid>
                        </Grid>
                    </Card>
                </Grid>
            </Grid>
        </Grid>
    )
}


export default ReactTemplatePage;