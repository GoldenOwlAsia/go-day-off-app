import React from "react";
import { connect } from "react-redux";
import { Formik, Field, Form } from "formik";
import { Link, withRouter, Redirect } from "react-router-dom";

import {
  Paper,
  Button,
  Input,
  InputLabel,
  Typography,
  CssBaseline,
  FormControl
} from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";

// Validation Schema
import LoginValidationSchema from "./validationSchema";

// Using api calls
import { login } from "../../apiCalls/authAPIs";

// auth Helpers
import * as authHelper from "../../helpers/authHelpers";

// Notification redux
import { showNotification } from "../../redux/actions/notificationActions";
import {
  NOTIF_ERROR,
  NOTIF_SUCCESS,
  // NOTIF_WARNING,
  NOTIF_INFO
} from "../../constants/notification";

// Animation
import CircularUnderLoad from "../../components/Animation/CircularUnderLoad";

const mapDispatchToProps = dispatch => {
  return {
    handleShowNotif: (type, message) =>
      dispatch(showNotification(type, message))
  };
};
// End - Notification redux

const styles = theme => ({
  main: {
    width: "auto",
    display: "block", // Fix IE 11 issue.
    marginLeft: theme.spacing.unit * 3,
    marginRight: theme.spacing.unit * 3,
    [theme.breakpoints.up(400 + theme.spacing.unit * 3 * 2)]: {
      width: 400,
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  paper: {
    marginTop: theme.spacing.unit * 8,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 3}px ${theme
      .spacing.unit * 3}px`
  },
  avatar: {
    margin: theme.spacing.unit,
    backgroundColor: theme.palette.secondary.main
  },
  form: {
    width: "100%", // Fix IE 11 issue.
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit
  },
  submit: {
    marginTop: theme.spacing.unit * 6
  },
  preload: {
    marginTop: theme.spacing.unit * 3
  },
  preloadWrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row"
  },
  forgotPwdHint: {
    marginTop: theme.spacing.unit * 3
  }
});

class LoginWithFormik extends React.Component {
  render() {
    const { classes, initialValues, handleShowNotif, history } = this.props;
    return authHelper.checkAuth() ? (
      <Redirect to="/" />
    ) : (
      <main className={classes.main}>
        <CssBaseline />
        <Paper className={classes.paper}>
          <Typography component="h1" variant="h4">
            Sign in
          </Typography>
          <Formik
            initialValues={initialValues}
            validateOnBlur={true}
            validationSchema={LoginValidationSchema}
            onSubmit={(values, actions) => {
              // showPreloading
              login(values)
                .then(res => {
                  const { success, access_token, refresh_token, user } = res.data;
                  if (success) {
                    authHelper.signIn(access_token, refresh_token, user);
                    if (authHelper.checkAuth()) {
                      handleShowNotif(NOTIF_SUCCESS, "Login successfully!");
                      setTimeout(() => history.push("/dashboard"), 500); //Timeout will make it smoothier
                    } else {
                      handleShowNotif(
                        NOTIF_INFO,
                        "Something went wrong! Please try again!"
                      );
                      actions.setSubmitting(false);
                    }
                  } else {
                    handleShowNotif(
                      NOTIF_INFO,
                      "Something went wrong! Please try again!"
                    );
                    actions.setSubmitting(false);
                  }
                })
                .catch(err => {
                  handleShowNotif(NOTIF_ERROR, `Login fail (${err.message})`);
                  actions.setSubmitting(false);
                });
            }}
          >
            {({
              errors,
              values,
              isSubmitting,
              handleReset,
              handleSubmit,
              handleChange,
              setSubmitting,
              setFieldValue,
              ...formikProps
            }) => (
              <Form className={classes.form}>
                <Field
                  name="username"
                  render={({ field, form, ...otherProps }) => {
                    return (
                      <FormControl margin="normal" required fullWidth>
                        <InputLabel htmlFor="username">Email</InputLabel>
                        <Input
                          autoFocus
                          id="username"
                          name="username"
                          type="text"
                          value={field.value}
                          autoComplete="username"
                          onChange={({ target: { value } }) =>
                            setFieldValue(field.name, value)
                          }
                        />
                      </FormControl>
                    );
                  }}
                />
                <Field
                  name="rawPwd"
                  render={({ field, form, ...otherProps }) => {
                    return (
                      <FormControl margin="normal" required fullWidth>
                        <InputLabel htmlFor="rawPwd">Password</InputLabel>
                        <Input
                          id="password"
                          name="rawPwd"
                          type="password"
                          value={field.value}
                          autoComplete="current-password"
                          onChange={({ target: { value } }) =>
                            setFieldValue(field.name, value)
                          }
                        />
                      </FormControl>
                    );
                  }}
                />
                <Button
                  fullWidth
                  type="submit"
                  color="primary"
                  variant="contained"
                  disabled={isSubmitting}
                  className={classes.submit}
                  onClick={handleSubmit}
                >
                  Let's GO
                </Button>
                {/** Progress Animation */}
                {isSubmitting ? (
                  <div className={classes.preloadWrapper}>
                    <CircularUnderLoad className={classes.preload} size={20} />
                  </div>
                ) : null}
                {/** End - Progress Animation */}
                <div className={classes.forgotPwdHint}>
                  Forgot password? Click <Link to="/forgot-password">here</Link>
                </div>
              </Form>
            )}
          </Formik>
        </Paper>
      </main>
    );
  }
}

LoginWithFormik.defaultProps = {
  initialValues: {
    username: "",
    rawPwd: ""
  }
};

export default withStyles(styles)(
  withRouter(
    connect(
      null,
      mapDispatchToProps
    )(LoginWithFormik)
  )
);
