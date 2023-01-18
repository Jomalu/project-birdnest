import {
  makeStyles,
  CssBaseline,
  Box,
  Container,
  Typography,
} from "@material-ui/core";
import DroneTable from "./components/DroneTable";

/**
 * Main application.
 * @returns Main application component.
 */
const App = () => {
  const classes = useStyles();

  return (
    <>
      <CssBaseline />
      <Box component="main">
        <Container maxWidth="md">
          <Typography
            variant="h2"
            component="h1"
            align="center"
            color="textPrimary"
          >
            Project Birdnest
          </Typography>
          <Typography
            variant="subtitle1"
            component="h4"
            align="center"
            color="textPrimary"
            gutterBottom
          >
            Johan Lummeranta (2023)
          </Typography>
          <Typography
            variant="h5"
            align="center"
            color="textSecondary"
            paragraph
          >
            Rudamentary application for tracking drones flying within{" "}
            <b>no drone zone</b>, or NDZ, around endangered Monadikuikka's
            nesting areas. The app gathers realtime data and presents
            information on the owners of the drones that have travelled the
            closest to the nest within the last 10 minutes.
          </Typography>
        </Container>
        <Box className={classes.root}>
          <DroneTable />
        </Box>
      </Box>
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    width: "100%",
    justifyContent: "center",
    alignContent: "center",
    "& > *": {
      margin: theme.spacing(1),
      width: "80%",
    },
  },
}));

export default App;
