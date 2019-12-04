import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import { Link } from 'react-router-dom';
import emailjs from 'emailjs-com';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import { Paper, Grid, Typography, TextField, Button, Slide } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Icon from '@material-ui/core/Icon';

// Using components
import SelectCustom from '../../components/CustomSelect';
import TextFieldReadOnly from '../../components/ReadOnlyTextField';
import DatePickerField from '../../components/DatePickers/FormDatePicker';
import CreatableSelectWithChips from '../../components/CreatableSelectWithChips';
import DashContainer from '../DashContainer';
// Validation
import { YupValidationSchema, CustomValidationSchema } from './validationSchema';

//constants
import { LeaveDurationOptions } from '../../constants/leaveDurationOptions';
import { mockupLeaveLetterReasons } from '../../constants/mockups';
import { EMAILJS_USER_ID } from '../../constants/api'

//helpers
import { getAllLeaveTypes } from '../../helpers/leaveLetterHelper';
import { getUserId } from '../../helpers/authHelpers';

//utilities
import { calculateDayOffWithOption, compareDatesWithoutTime } from '../../utilities';

// API calls
import Axios, { CancelToken } from 'axios';
import { 
  getAllApprover,
  getAllInformTo, 
  getAllSubsitutes,  
} from '../../apiCalls/userAPIs';
import { getDayOffSetting } from '../../apiCalls/settingAPIs';
import { createLeaveLetter } from '../../apiCalls/leaveLetterAPI';
import { getDayOff } from '../../apiCalls/userAPIs';
import { getProfile } from '../../apiCalls/userAPIs';

// Notification redux
import {
  showNotification,
  hideNotification
} from '../../redux/actions/notificationActions';
import { NOTIF_ERROR, NOTIF_SUCCESS, USER_LEFT_PAGE } from '../../constants/notification';
import CircularUnderLoad from '../../components/Animation/CircularUnderLoad';
import DaySessionsRadio from '../../components/DaySessionsRadio';

const mapDispatchToProps = dispatch => {
  return {
    handleShowNotif: (type, message) =>
      dispatch(showNotification(type, message)),
    handleHideNotif: () => dispatch(hideNotification()),
    handleShowNotifNoHide: (type, message, autoHide = false) =>
      dispatch(showNotification(type, message, autoHide))
  };
};

// Option for no-select option
const noSelectOption = {
  label: 'None',
  value: '',
}

class AbsenceLetterWithFormik extends React.Component {
  state = {
    templateList: {
      leaveTypesList: [],
      informToList: [],
      approverList: [],
      substitutesList: [],
    },
    otherReasonSelected: false,
    buttonClickable: false,
    isRequestCreated: false,
    lastLetterId: undefined,
    userInfo: undefined,
  };

  switchButtonCtrl = enable => {
    this.__isMounted && this.setState(prevState => ({
      ...prevState,
      buttonClickable: enable
    }));
  };

  handleChangeReason = async (value = '') => {
    if (value === mockupLeaveLetterReasons[mockupLeaveLetterReasons.length - 1].value) {
      this.__isMounted && this.setState(prevState => ({
        ...prevState,
        otherReasonSelected: true
      }));
    } else {
      this.__isMounted && this.setState(prevState => ({
        ...prevState,
        otherReasonSelected: false
      }));
    }
  };

  async componentDidMount() {
    this.__isMounted = true;
    const allLeaveTypes = getAllLeaveTypes();
    const { handleShowNotifNoHide } = this.props;
    this.cancelSource = CancelToken.source();
    // Call api request:
    let response = await getProfile(getUserId());
    let {
      status: statusDemandUser,
      data: { success: successDemandUser, user: demandInfo }
    } = response;
    if(statusDemandUser !== 200 || successDemandUser !== true || !demandInfo) return;
    this.__isMounted && this.setState({ userInfo: demandInfo });


    Axios.all([ getAllApprover(), getAllInformTo(), getAllSubsitutes() ])
      .then(
        Axios.spread((first, second, third) => {
          //approvers must be existed
          let allApprover = first.data.approvers.map(item => ({
            value: item.fId,
            label: `${item.fFirstName} ${item.fLastName}`
          }));
          // "informTo" is optional, need to check
          let allInformTo = null;
          if (second.data.msg && second.data.msg === 'LEADERS_NOT_FOUND' )
          {
            allInformTo = [];
          } else {
            allInformTo = [
              {
                value: second.data.teamLeader.fEmail,
                label: `${second.data.teamLeader.fFirstName} ${
                  second.data.teamLeader.fLastName
                }`
              }
            ];
          }
          // "informTo" is optional, need to check

          let allSubstitutes = null;
          if (third.data.msg && third.data.msg === 'SUBSTITUTES_NOT_FOUND') {
            allSubstitutes = [];
          }
          else {
            allSubstitutes = third.data.substitutes.map(item => ({
              value: item.fId,
              additionInfo: item.fEmail,
              label: `${item.fFirstName} ${item.fLastName}`
            }));
          }
          this.__isMounted && this.setState(prevState => ({
            ...prevState,
            templateList: {
              informToList: allInformTo,
              approverList: allApprover,
              leaveTypesList: allLeaveTypes,
              substitutesList: [
                noSelectOption,
                ...allSubstitutes
              ]
            },
            buttonClickable: true
          }));
        })
      )
      .catch(err => {
        handleShowNotifNoHide(NOTIF_ERROR, `${err.message}`);
        this.switchButtonCtrl(false);
      });

    //Load usedDayOff
    getDayOff(this.cancelSource.token, getUserId()).then(res => {
      let usedDayOff = '-';
      if (res.data.success) {
        usedDayOff = res.data.fYearUsed;
      }

      this.__isMounted && this.setState({ usedDayOff });
    }).catch(err => {
      if (err.message !== USER_LEFT_PAGE) 
      (this.__isMounted && this.props.handleShowNotif) && this.props.handleShowNotif(NOTIF_ERROR, `Couldn't load 'Used Day-off'!`);
    });

    getDayOffSetting(this.cancelSource.token)
    .then(res => {
        let dayOffSetting = '-';
        if (res.data.success) {
          const { settings } = res.data;
          dayOffSetting = settings[0].fValue;
        }
        this.__isMounted && this.setState({ dayOffSetting });
      })
    .catch(err => {
      if (err.message !== USER_LEFT_PAGE) 
      (this.__isMounted && this.props.handleShowNotif) && this.props.handleShowNotif(NOTIF_ERROR, `Couldn't load 'Day-off Setting'!`);
    });
  }

  componentWillUnmount = () => {
    this.__isMounted = false;
    this.cancelSource.cancel(`User has suddenly left the page!`);
  }

  sendRequestEmail = (user, letter) => {
    const fullName = `${user.fFirstName} ${user.fLastName}`;
    const startDate = letter.startDate.toString().substring(0, 10);
    const startSession = letter.fromOpt === 'afternoon' ? '(afternoon)' : '';
    const endDate = letter.endDate.toString().substring(0, 10);
    const endSession = letter.toOpt === 'morning' ? '(morning)' : '';
    const leaveReason = letter.reason;

    const emailParams = {
      to_email: 'phamtrongan@outlook.com ',
      fullName,
      startDate,
      startSession,
      endDate,
      endSession,
      leaveReason,
    }

    return emailjs.send('gmail', 'goleavesrequest', emailParams, EMAILJS_USER_ID);
  }

  render() {
    const { classes, initialValues, handleShowNotif } = this.props;
    const {
      templateList: { leaveTypesList, informToList, approverList, substitutesList },
      otherReasonSelected
    } = this.state;
    const { usedDayOff, dayOffSetting } = this.state;

    return (
      <DashContainer>
        <main className={classes.layout}>
          <Paper className={classes.paper}>
            <Formik
              initialValues={initialValues}
              // validateOnChange
              validationSchema={YupValidationSchema}
              validate={CustomValidationSchema}
              onReset={(values, actions) => {
                this.handleChangeReason();
              }}
              onSubmit={(values, actions) => {
                let submitValues = JSON.parse(JSON.stringify(values));
                const { userInfo } = this.state;
                const { sendRequestEmail } = this;

                if (compareDatesWithoutTime(values.startDate, values.endDate) === 0) {
                  submitValues.toOpt = submitValues.fromOpt;
                }

                Axios.all([createLeaveLetter(submitValues), sendRequestEmail(userInfo, submitValues)]) 
                  .then(Axios.spread((cLLRes, sRERes) => {
                    const { fId } = cLLRes.data.leaveLetter.leaveLetter;
                    this.__isMounted && this.setState({
                      lastLetterId: fId,
                      isRequestCreated: true,
                    }, () => {
                      handleShowNotif(NOTIF_SUCCESS, `Leave request created successfully!`);
                      this.handleChangeReason();
                      actions.resetForm();
                      actions.setSubmitting(false);
                    });
                  }))
                  .catch(err => {
                  console.log("TCL: render -> err", err)
                    handleShowNotif(NOTIF_ERROR, `Can't create Leave request! Try later`);
                    actions.setSubmitting(false);
                  });
              }}
              render={({
                values,
                handleBlur,
                handleReset,
                handleSubmit,
                handleChange,
                isSubmitting,
                setFieldValue,
              }) => {
                const { buttonClickable, isRequestCreated, lastLetterId } = this.state;
                const isSameDaySelected = compareDatesWithoutTime(values.startDate, values.endDate) === 0;
                return (
                  <Form>
                    {/* Top buttons */}
                    {/* <React.Fragment>
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
                              color="primary"
                              variant="contained"
                              onClick={handleSubmit}
                              disabled={isSubmitting || !buttonClickable}
                            >
                              Send
                              <Icon
                                fontSize="small"
                                className={classes.rightIcon}
                              >
                                send_outlined
                              </Icon>
                            </Button>
                          )}
                        />
                        <Field
                          render={() => (
                            <Button
                              className={classes.button}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              onClick={handleReset}
                              disabled={isSubmitting || !buttonClickable}
                            >
                              Reset
                              <Icon
                                fontSize="small"
                                className={classes.rightIcon}
                              >
                                delete_sweep
                              </Icon>
                            </Button>
                          )}
                        />
                      </Grid>
                    </React.Fragment> */}
                    {/* End - Top buttons  */}
                    <React.Fragment>
                      <Typography
                        className={classes.formTitle}
                        component="h1"
                        variant="h5"
                        align="center"
                      >
                        Create new request
                      </Typography>
                    </React.Fragment>
                    {/* Form's content*/}
                    <React.Fragment>
                      {/* Form */}
                      <Grid container spacing={16}>
                        {/* Left side */}
                        <Grid item xs={12} sm={6} container spacing={8}>
                          <Grid item xs={12}>
                            {/* Show Duration */}
                            <Field
                              name="duration"
                              render={({ form }) => {
                                const calculatedDayOff = calculateDayOffWithOption(
                                  moment(form.values.startDate),
                                  moment(form.values.endDate),
                                  values.fromOpt,
                                  values.toOpt
                                );
                                const remainAnnualDayOff = !isNaN(usedDayOff) && !isNaN(dayOffSetting) 
                                      ? ( dayOffSetting - usedDayOff - calculatedDayOff > 0 ? ` - [${dayOffSetting - usedDayOff - calculatedDayOff} day(s) left]` : ' - [0 day left]') 
                                      : '';
                                //do something
                                return (
                                  <TextFieldReadOnly
                                    fullWidth
                                    label="Duration"
                                    defaultValue={`${calculatedDayOff} working day(s)` + remainAnnualDayOff}
                                  />
                                );
                              }}
                            />
                          </Grid>

                          {/* Date picker */}
                          <Grid item container spacing={16}>
                            <Grid item xs={6}>
                              {/* From startDate - to endDate*/}
                              <Field
                                fullWidth
                                label="From"
                                name="startDate"
                                component={DatePickerField}
                                onBlurCapture={handleBlur}
                              />
                              <ErrorMessage name="startDate">
                                {msg => (
                                  <div className={classes.errorMessage}>
                                    {msg}
                                  </div>
                                )}
                              </ErrorMessage>
                              <Field
                                label="Option"
                                name="fromOpt"
                                component={DaySessionsRadio}
                                disableMorning={!isSameDaySelected}
                              />
                            </Grid>
                            <Grid item xs={6}>
                              <Field
                                fullWidth
                                label="To"
                                name="endDate"
                                minDate={values.startDate}
                                component={DatePickerField}
                              />
                              <ErrorMessage name="endDate">
                                {msg => (
                                  <div className={classes.errorMessage}>
                                    {msg}
                                  </div>
                                )}
                              </ErrorMessage>
                              <Field
                                label="Option"
                                name="toOpt"
                                component={DaySessionsRadio}
                                disabled={isSameDaySelected}
                                disableAfternoon={!isSameDaySelected}
                              />
                            </Grid>
                          </Grid>
                          {/* End - Date picker */}
                        </Grid>
                        {/* End - Left side */}
                        {/* Right side */}
                        <Grid item xs={12} sm={6} container spacing={8}>
                          <Grid item xs={12}>
                            {/* Select Leave type */}
                            <Field
                              render={({ field, form }) => {
                                return (
                                  <SelectCustom
                                    name="leaveType"
                                    label="Leave Types"
                                    value={values.leaveType}
                                    options={leaveTypesList}
                                    onBlur={handleBlur} //not handled
                                    onChange={({ target: { name, value } }) => {
                                      setFieldValue(name, value);
                                    }}
                                  />
                                );
                              }}
                            />
                            <ErrorMessage name="leaveType">
                              {msg => (
                                <div className={classes.errorMessage}>
                                  {msg}
                                </div>
                              )}
                            </ErrorMessage>
                          </Grid>
                          <Grid item xs={12}>
                            {/* Supervisor */}
                            <Field
                              render={({ field, form }) => (
                                <SelectCustom
                                  name="approver"
                                  label="Approver*"
                                  options={approverList}
                                  value={values.approver}
                                  onBlur={handleBlur}
                                  onChange={handleChange}
                                />
                              )}
                            />
                            <ErrorMessage name="approver">
                              {msg => (
                                <div className={classes.errorMessage}>
                                  {msg}
                                </div>
                              )}
                            </ErrorMessage>
                          </Grid>
                          <Grid item xs={12}>
                            {/* Inform to  */}
                            <Field
                              multiple
                              name="informTo"
                              label="Inform to"
                              onBlur={handleBlur}
                              options={informToList}
                              component={CreatableSelectWithChips}
                            />
                            <ErrorMessage name="informTo">
                              {msg => (
                                <div className={classes.errorMessage}>
                                  {msg}
                                </div>
                              )}
                            </ErrorMessage>
                          </Grid>
                          {/* <Grid item xs={12}> */}
                            {/* Substitute Selection  */}
                            {/* <Field
                              render={({ field, form }) => (
                                <SelectCustom
                                  name="substituteId"
                                  label="Substitute"
                                  value={values.substituteId}
                                  options={substitutesList}
                                  onBlur={handleBlur}
                                  onChange={handleChange}
                                />
                              )}
                            />
                            <ErrorMessage name="substituteId">
                              {msg => (
                                <div className={classes.errorMessage}>
                                  {msg}
                                </div>
                              )}
                            </ErrorMessage>
                          </Grid> */}
                          <Grid item xs={12}>
                            {/* Reason Selection  */}
                            <Field
                              render={({ field, form }) => (
                                    <TextField
                                      required
                                      multiline
                                      fullWidth
                                      id="reason"
                                      name="reason"
                                      label="Reason"
                                      onBlur={handleBlur}
                                      onChange={({ target: { name, value } }) =>
                                        setFieldValue(name, value)
                                      }
                                    />
                              )}
                            />
                            <ErrorMessage name="reason">
                              {msg => (
                                <div className={classes.errorMessage}>
                                  {msg}
                                </div>
                              )}
                            </ErrorMessage>
                          </Grid>
                          {/* <Grid item xs={12}> */}
                            {/* Reason Selection  */}
                            {/* <Field
                              render={({ field, form }) => (
                                <SelectCustom
                                  name="reason"
                                  label="Reason*"
                                  value={values.reason}
                                  options={mockupLeaveLetterReasons}
                                  onBlur={handleBlur}
                                  onChange={({ target: { name, value } }) => {
                                    setFieldValue(name, value);
                                    this.handleChangeReason(value);
                                  }}
                                />
                              )}
                            />
                            <ErrorMessage name="reason">
                              {msg => (
                                <div className={classes.errorMessage}>
                                  {msg}
                                </div>
                              )}
                            </ErrorMessage>
                          </Grid> */}
                          {/* Reason in detail */}
                          {/* <Grid item xs={12}>
                            {otherReasonSelected ? (
                              <React.Fragment>
                                <Field
                                  name="otherReason"
                                  render={({ field, form }) => (
                                    <TextField
                                      required
                                      multiline
                                      fullWidth
                                      id="otherReason"
                                      name="otherReason"
                                      label="Reason detail"
                                      onBlur={handleBlur}
                                      onChange={({ target: { name, value } }) =>
                                        setFieldValue(name, value)
                                      }
                                    />
                                  )}
                                />
                                <ErrorMessage name="otherReason">
                                  {msg => (
                                    <div className={classes.errorMessage}>
                                      {msg}
                                    </div>
                                  )}
                                </ErrorMessage>
                              </React.Fragment>
                            ) : null}
                          </Grid> */}
                          {/* End - Reason in detail */}
                        </Grid>
                        {/* End - Right side */}
                      </Grid>
                      {/* End - Form */}
                    </React.Fragment>
                    <React.Fragment>
                      {isSubmitting ? (
                        <div className={classes.preloadWrapper}>
                          <CircularUnderLoad
                            className={classes.preload}
                            size={20}
                          />
                        </div>
                      ) : null}
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
                          disabled={isSubmitting || !buttonClickable}
                        >
                          Send
                          <Icon fontSize="small" className={classes.rightIcon}>
                            send_outlined
                          </Icon>
                        </Button>
                        <Button
                          size="small"
                          color="secondary"
                          variant="outlined"
                          onClick={handleReset}
                          className={classes.button}
                          disabled={isSubmitting || !buttonClickable}
                        >
                          Reset
                          <Icon fontSize="small" className={classes.rightIcon}>
                            delete_sweep
                          </Icon>
                        </Button>
                      </Grid>
                    </React.Fragment>
                        <Grid container item xs={12} className={classes.linkRequestBottom}>
                          <Slide direction='right' in={isRequestCreated} mountOnEnter unmountOnExit>
                            <Paper elevation={4} className={classes.linkRequestPaper}>
                              Review request {' '}
                              <Link to={`/leave-request/${lastLetterId}`}>
                                #{lastLetterId}
                              </Link>
                            </Paper>
                          </Slide>
                        </Grid>
                  </Form>
                );
              }}
            />
          </Paper>
        </main>
      </DashContainer>
    );
  }
}

AbsenceLetterWithFormik.defaultProps = {
  initialValues: {
    leaveType: 1,
    startDate: moment().add(1, 'days'),
    endDate: moment().add(1, 'days'),
    approver: '',
    informTo: [], //must be an array
    substituteId: '', //Temporarily mockup
    reason: '',
    // otherReason: '', // comment for now
    fromOpt: LeaveDurationOptions.all,
    toOpt: LeaveDurationOptions.all
  }
};

const styles = theme => ({
  appBar: {
    position: 'relative'
  },
  layout: {
    width: 'auto',
    marginLeft: theme.spacing.unit * 2,
    marginRight: theme.spacing.unit * 2,
    [theme.breakpoints.up(600 + theme.spacing.unit * 2 * 2)]: {
      minWidth: 600,
      marginLeft: 'auto',
      marginRight: 'auto'
    },
  },
  paper: {
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3,
    padding: theme.spacing.unit * 3,
    [theme.breakpoints.up(600 + theme.spacing.unit * 3 * 2)]: {
      marginTop: theme.spacing.unit * 6,
      marginBottom: theme.spacing.unit * 6,
      padding: theme.spacing.unit * 3
    }
  },
  // buttonGroupTop: {
  //   justifyContent: 'flex-start',
  //   marginBottom: theme.spacing.unit * 3,
  //   [theme.breakpoints.down('xs')]: {
  //     display: 'none'
  //   },
  //   [theme.breakpoints.up('sm')]: {
  //     display: 'flex'
  //   }
  // },
  linkRequestBottom: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: '20px',
    marginRight: '5px',
  },
  linkRequestPaper: {
    backgroundColor: '#e2e2e2',
    padding: '5px',
    color: '#000',
  },
  buttonGroupBottom: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.unit * 3,
    // [theme.breakpoints.up('sm')]: {
    //   display: 'none'
    // },
    // [theme.breakpoints.down('xs')]: {
    //   display: 'flex'
    // }
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
  },
  errorMessage: {
    color: 'red',
    fontSize: 12,
    fontWeight: 500
  },
  preload: {
    marginTop: theme.spacing.unit * 3
  },
  preloadWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  }
});

export default withStyles(styles)(
  connect(
    null,
    mapDispatchToProps
  )(AbsenceLetterWithFormik)
);
