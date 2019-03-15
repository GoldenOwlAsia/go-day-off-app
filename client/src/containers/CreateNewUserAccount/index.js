import React from 'react';
import { connect } from 'react-redux';
import { Formik, Form, Field } from 'formik';

import {
  Paper,
  Button,
  Grid,
  CssBaseline,
  TextField,
  Typography
} from '@material-ui/core';

import { withStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';

import SelectCustom from '../../components/CustomSelect';
import DatePickerField from '../../components/DatePicker';
import DashContainer from '../DashContainer';

//Constants
import { responseUserPermission } from '../../constants/permission';

//API
import Axios from 'axios';
import { getAllTeams, getAllPositions } from '../../apiCalls/supportingAPIs';
import { createNewUser } from '../../apiCalls/userAPIs';
import moment from 'moment';

// Notification redux
import { showNotification } from '../../redux/actions/notificationActions';
import { NOTIF_ERROR, NOTIF_SUCCESS } from '../../constants/notification';
import CircularUnderLoad from '../../components/Animation/CircularUnderLoad';

const mapDispatchToProps = dispatch => {
  return {
    handleShowNotif: (type, message) =>
      dispatch(showNotification(type, message))
  };
};

const styles = theme => ({
  layout: {
    width: 'auto',
    marginLeft: theme.spacing.unit * 2,
    marginRight: theme.spacing.unit * 2,
    [theme.breakpoints.up(600 + theme.spacing.unit * 2 * 2)]: {
      minWidth: 600,
      marginLeft: 'auto',
      marginRight: 'auto'
    }
  },
  paper: {
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
    padding: theme.spacing.unit * 3,
    [theme.breakpoints.up(600 + theme.spacing.unit * 3 * 2)]: {
      marginTop: theme.spacing.unit * 6,
      marginBottom: theme.spacing.unit * 6,
      padding: theme.spacing.unit * 3,
      paddingBottom: theme.spacing.unit * 6
    }
  },
  buttonGroupTop: {
    justifyContent: 'flex-start',
    marginBottom: theme.spacing.unit * 3,
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    },
    [theme.breakpoints.up('sm')]: {
      display: 'flex'
    }
  },
  buttonGroupBottom: {
    justifyContent: 'flex-end',
    marginTop: theme.spacing.unit * 6,
    [theme.breakpoints.up('sm')]: {
      display: 'none'
    },
    [theme.breakpoints.down('xs')]: {
      display: 'flex'
    }
  },
  button: {
    marginLeft: theme.spacing.unit,
    width: 100
  },
  leftIcon: {
    marginRight: theme.spacing.unit
  },
  rightIcon: {
    marginLeft: theme.spacing.unit
  },
  smallIcon: {
    fontSize: 20
  },
  formTitle: {
    marginBottom: theme.spacing.unit * 3
  }
});

class CreateNewAccount extends React.Component {
  state = {
    allTeams: [],
    allPositions: []
  };

  componentDidMount = () => {
    Axios.all([getAllTeams(), getAllPositions()])
      .then(
        Axios.spread((allTeamResponse, allPositionResponse) => {
          let allTeams = allTeamResponse.data.teams.map(item => ({
            value: item.fId,
            label: item.fTeamName
          }));

          let allPositions = allPositionResponse.data.positions.map(item => ({
            value: item.fId,
            label: item.fPosName
          }));

          this.setState(prevState => ({
            ...prevState,
            allTeams,
            allPositions
          }));
        })
      )
      .catch(err => {
        console.log('error -> ', err);
      });
  };
  render() {
    const { classes, initialValues, handleShowNotif } = this.props;
    const { allTeams, allPositions } = this.state;
    return (
      <DashContainer className={classes.layout}>
        <Paper className={classes.paper}>
          <CssBaseline />
          <Formik
            initialValues={initialValues}
            onSubmit={(values, actions) => {
              //Call api update here
              console.log(values);
              createNewUser(values)
                .then(res => {
                  console.log(res);
                  handleShowNotif(
                    NOTIF_SUCCESS,
                    `Created new account successfully!`
                  );
                  actions.setSubmitting(false);
                })
                .catch(err => {
                  console.log(err);
                  handleShowNotif(
                    NOTIF_ERROR,
                    `Action failed! (${err.message})`
                  );
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
              setFieldValue,
              handleChange,
              ...formikProps
            }) => {
              return (
                <Form>
                  {/* Top buttons */}
                  <React.Fragment>
                    <Grid
                      item
                      container
                      xs={12}
                      className={classes.buttonGroupTop}
                    >
                      <Field
                        render={({ field, form }) => (
                          <Button
                            className={classes.button}
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                          >
                            <Icon fontSize="small" className={classes.leftIcon}>
                              save
                            </Icon>
                            SAVE
                          </Button>
                        )}
                      />
                      <Field
                        render={({ field, form }) => (
                          <Button
                            className={classes.button}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            onClick={handleReset}
                            disabled={isSubmitting}
                          >
                            <Icon fontSize="small" className={classes.leftIcon}>
                              delete_sweep
                            </Icon>
                            Discard
                          </Button>
                        )}
                      />
                    </Grid>
                  </React.Fragment>
                  {/* End - Top buttons */}
                  <React.Fragment>
                    <Typography
                      className={classes.formTitle}
                      component="h1"
                      variant="h5"
                      align="center"
                    >
                      Create new account
                    </Typography>
                  </React.Fragment>
                  <React.Fragment>
                    {/** First name */}
                    <Grid container spacing={16}>
                      <Grid item xs={12} sm={6}>
                        <Field
                          name="firstName"
                          render={({ field, form, ...otherProps }) => {
                            return (
                              <TextField
                                fullWidth
                                label="First name"
                                name={field.name}
                                value={field.value}
                                onChange={handleChange}
                              />
                            );
                          }}
                        />
                      </Grid>
                      {/** Last name */}
                      <Grid item xs={12} sm={6}>
                        <Field
                          name="lastName"
                          render={({ field, form, ...otherProps }) => {
                            return (
                              <TextField
                                fullWidth
                                label="Last name"
                                name={field.name}
                                value={field.value}
                                onChange={handleChange}
                              />
                            );
                          }}
                        />
                      </Grid>
                      {/** gender */}
                      <Grid item xs={12} sm={6}>
                        <Field
                          name="gender"
                          render={({ field, form, ...otherProps }) => {
                            return (
                              <SelectCustom
                                name={field.name}
                                label="Gender"
                                value={field.value}
                                options={mockup_gender}
                                onChange={handleChange}
                              />
                            );
                          }}
                        />
                      </Grid>
                      {/** birthday */}
                      <Grid item xs={12} sm={6}>
                        <Field
                          fullWidth
                          name="bday"
                          label="Birthday"
                          enablePast
                          component={DatePickerField}
                        />
                      </Grid>
                      {/** email  */}
                      <Grid item xs={12} sm={6}>
                        <Field
                          name="email"
                          render={({ field, form, ...otherProps }) => {
                            return (
                              <TextField
                                fullWidth
                                label="Email"
                                value={field.value}
                                name={field.name}
                                onChange={handleChange}
                              />
                            );
                          }}
                        />
                      </Grid>
                      {/** phone number  */}
                      <Grid item xs={12} sm={6}>
                        <Field
                          name="phone"
                          render={({ field, form, ...otherProps }) => {
                            return (
                              <TextField
                                fullWidth
                                label="Phone"
                                value={field.value}
                                name={field.name}
                                onChange={handleChange}
                              />
                            );
                          }}
                        />
                      </Grid>
                      {/** address  */}
                      <Grid item xs={12}>
                        <Field
                          name="address"
                          render={({ field, form, ...otherProps }) => {
                            return (
                              <TextField
                                multiline
                                fullWidth
                                label="Address"
                                value={field.value}
                                name={field.name}
                                onChange={handleChange}
                              />
                            );
                          }}
                        />
                      </Grid>
                      {/** team name */}
                      <Grid item xs={12} sm={6}>
                        <Field
                          name="team"
                          render={({ field, form, ...otherProps }) => {
                            return (
                              <SelectCustom
                                name={field.name}
                                label="Team"
                                value={field.value}
                                options={allTeams}
                                onChange={handleChange}
                              />
                            );
                          }}
                        />
                      </Grid>
                      {/** position name */}
                      <Grid item xs={12} sm={6}>
                        <Field
                          name="position"
                          render={({ field, form, ...otherProps }) => {
                            return (
                              <SelectCustom
                                name={field.name}
                                label="Position"
                                value={field.value}
                                options={allPositions}
                                onChange={handleChange}
                              />
                            );
                          }}
                        />
                      </Grid>
                      {/** username  */}
                      <Grid item xs={12} sm={6}>
                        <Field
                          name="username"
                          render={({ field, form, ...otherProps }) => {
                            return (
                              <TextField
                                multiline
                                fullWidth
                                label="Username"
                                value={field.value}
                                name={field.name}
                                onChange={handleChange}
                              />
                            );
                          }}
                        />
                      </Grid>
                      {/** rawPwd  */}
                      <Grid item xs={12} sm={6}>
                        <Field
                          name="rawPwd"
                          render={({ field, form, ...otherProps }) => {
                            return (
                              <TextField
                                multiline
                                fullWidth
                                label="Password"
                                value={field.value}
                                name={field.name}
                                onChange={handleChange}
                              />
                            );
                          }}
                        />
                      </Grid>
                    </Grid>
                  </React.Fragment>
                  <React.Fragment>
                    {/* Bottom buttons */}
                    <Grid item xs={12} className={classes.buttonGroupBottom}>
                      <Button
                        size="small"
                        color="primary"
                        variant="contained"
                        onClick={handleSubmit}
                        className={classes.button}
                        disabled={isSubmitting}
                      >
                        <Icon fontSize="small" className={classes.leftIcon}>
                          save
                        </Icon>
                        SAVE
                      </Button>
                      <Button
                        size="small"
                        color="secondary"
                        variant="outlined"
                        onClick={handleReset}
                        className={classes.button}
                        disabled={isSubmitting}
                      >
                        <Icon fontSize="small" className={classes.leftIcon}>
                          delete_sweep
                        </Icon>
                        Discard
                      </Button>
                    </Grid>
                  </React.Fragment>
                </Form>
              );
            }}
          </Formik>
        </Paper>
      </DashContainer>
    );
  }
}

CreateNewAccount.defaultProps = {
  initialValues: {
    username: '',
    rawPwd: '',
    firstName: '',
    lastName: '',
    gender: 0,
    bday: moment(),
    position: '',
    address: '',
    phone: '',
    team: '',
    email: '',
    typeId: responseUserPermission['USER']
  }
};

const mockup_gender = [
  {
    value: 0,
    label: 'Female'
  },
  {
    value: 1,
    label: 'Male'
  },
  {
    value: 2,
    label: 'Others'
  }
];

export default withStyles(styles)(
  connect(
    null,
    mapDispatchToProps
  )(CreateNewAccount)
);
