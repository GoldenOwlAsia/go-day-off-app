import moment from 'moment-timezone';
import { connect } from 'react-redux';
import { withRouter } from "react-router-dom";
import React, { Component, Fragment } from 'react';
import MUIDataTable from 'mui-datatables';
// import ExcelExporter from './ExcelExporter';
import { Typography, Button, withStyles } from '@material-ui/core';
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core";
import { CancelToken } from 'axios';
/**
 * Constants
 */
import { letterColors, letterStatusText, dayOfWeek, defaultColumns, AdminColumns, defaultExportColumns, AdminExportColumns } from "../../constants/letter";
import { REJECT_TYPE } from '../../constants/rejectType'; 
import { userTypes } from '../../constants/permission';

// Components
import LetterManagementToolbar from '../LetterManagementToolbar';

/**
 * Helpers 
 */
import { getUserId } from '../../helpers/authHelpers';
import { formatRow } from "../../helpers/excelFormatter";


// Notification redux
import {
  showNotification,
} from '../../redux/actions/notificationActions';
import { NOTIF_ERROR, NOTIF_SUCCESS } from '../../constants/notification';

// letterFilter redux
import {
  letterFilterChangeAll
} from '../../redux/actions/letterFilterActions';

//overrides theme
const materialTheme = createMuiTheme({
  overrides: {
    MUIDataTableToolbar: {
      left: {
        flex: '1',
      },
      actions: {
        flex: '2',
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',      
        flexDirection: 'row-reverse',
      }
    },
    MuiFormControl: {
      root: {
        width: '135px',
        margin: '0 5px 0 0 !important',
      }
    },
    MuiTableRow: {
      root: {
        cursor: 'pointer',
      }
    },
  }
})

const getDate = (rawDate = '') => {
  const date = moment(rawDate).isValid() && moment.tz(rawDate, 'Asia/Bangkok');
  return !date ?
    'Invalid date' :
    dayOfWeek[date.day()] + ', ' + date.format('DD/MM/YYYY');
};

class LetterManagement extends Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 1,
      size: 10,
      count: 0,
      letters: [],
      exports: []
    };
    this.downloadTriggerRef = React.createRef(); 
  }

  componentDidMount = () => {
    this.__isMounted = true;
    this.cancelSource = CancelToken.source();
    this.props.filterValues !== undefined ? this.loadDataWithFilter() : this.loadDataWithoutFilter();
  };

  componentWillUnmount = () => {
    this.__isMounted = false;
    this.cancelSource.cancel('Request cancelled by user!');
  }

  loadDataWithoutFilter = async () => {
    const { demandUserId } = this.props;
    try {
      const {
        data: { success, leaveLetters: letters, count }
      } = await this.props.api(this.cancelSource.token, 1, 10, demandUserId);

      if (success)
        this.__isMounted 
        && this.setState({ letters, count }, () => {
          this.props.handleShowNotif(NOTIF_SUCCESS, `Load data complete!`)
        });
    } catch (err) {
      this.props.handleShowNotif(NOTIF_ERROR, `Load data failed! (${err.message})`)
    }
  }

  loadDataWithFilter = async () => {
    this.handleFilterValueChange(this.props.filterValues);
  }

  handleFilterValueChange = async (values, formikActions = undefined) => {
    const { demandUserId, type } = this.props;
    const fromDate = new Date(values.fromDate),
          toDate   = new Date(values.toDate);

    let userId;
    if (type && type === userTypes.MODE_ADMIN) {
      userId = '';
    } else {
      if (demandUserId !== undefined) {
        userId = demandUserId;
      }
      else {
        userId = getUserId();
      }
    }
    // below `try-catch` block maybe have same logic to this.handleChangePageWithFilter
    try {
      const fromMonth = fromDate.getMonth() + 1,
            toMonth   = toDate.getMonth() + 1,
            fromYear  = fromDate.getFullYear(),
            toYear    = toDate.getFullYear();
      const filterData = {
        userId, 
        fromDay: 1,
        fromMonth,
        fromYear, 
        toDay: 31,
        toMonth, 
        toYear, 
        status: values.status,
      }

      const { 
        data: { success, leaveLetters, count }
      } = await this.props.filterAPI( this.cancelSource.token, filterData);
      if (success && this.__isMounted) {
        formikActions !== undefined && this.props.handleChangeFilterValue({
          toDate,
          fromDate,
          status: values.status
        });
        this.setState(
          {
            count,
            letters: leaveLetters,
          }, () => {
            formikActions !== undefined && formikActions.setSubmitting(false)
          }
        );
      }
    }
    catch (err) {
      this.props.handleShowNotif(NOTIF_ERROR, `Load data failed! (${err.message})`)
      formikActions !== undefined && formikActions.setSubmitting(false)
    }
  }

  handleChangePage = (size = 10, page = 1, demandUserId) => {
    this.props.api(this.cancelSource.token, page, size, demandUserId)
    .then(({ data: { success, leaveLetters: letters, count } }) => 
      this.__isMounted && success 
      && this.setState(
        { letters, 
          count,
          page,
          size 
        }, () => {}
      )
    )
    .catch(error => {
      this.props.handleShowNotif(NOTIF_ERROR, `Action failed! (${error.message})`)
    });
  };

  handleChangPageWithFilter = async (size=10, page=1, demandUserId) => {
    const { fromDate, toDate, status } = this.props.filterValues;
    try {
      const fromMonth = fromDate.getMonth() + 1,
            toMonth   = toDate.getMonth() + 1,
            fromYear  = fromDate.getFullYear(),
            toYear    = toDate.getFullYear();
      const filterData = {
        userId: demandUserId, 
        fromMonth,
        fromYear, 
        toMonth, 
        toYear, 
        status,
        page,
        size,
      }
      const { 
        data: { success, leaveLetters, count }
      } = await this.props.filterAPI( this.cancelSource.token, filterData);
      if (success && this.__isMounted) {
        this.setState(
          {
            count,
            letters: leaveLetters,
            page,
            size,
          }, () => {}
        );
      }
    }
    catch (err) {
      this.props.handleShowNotif(NOTIF_ERROR, `Action failed! (${err.message})`)
    }
  }

  render() {
    const { letters, exports } = this.state;
    const { classes, title, type, demandUserId } = this.props;
    const handleChangePageFunc = this.props.filterValues !== undefined ? this.handleChangPageWithFilter : this.handleChangePage;

    const tableInfo = {
      columns: type === userTypes.MODE_ADMIN ? AdminColumns : defaultColumns,
      title: <Typography component='p' variant='h5' className={classes.title}> {title} </Typography>,
      data: Array.isArray(letters)
        ? letters.map(({ fUserFullName, fFromDT, fFromOpt, fToDT, fToOpt, fStatus, fId, fRdt, fRejectType }) => {
          const dataSet = [
            fId,
            getDate(fRdt),
            getDate(fFromDT),
            getDate(fToDT),
            fRejectType && fRejectType === REJECT_TYPE.BY_SELF? `CANCELED` : letterStatusText[fStatus],
          ];
          if (type === userTypes.MODE_ADMIN) dataSet.splice(1, 0, fUserFullName || 'Unknown');
          return dataSet;
        }) : [],
      options: {
        print: false,
        filter: false,
        search: false,
        serverSide: true,
        viewColumns: false,
        responsive: 'scroll',
        selectableRows: false,
        count: this.state.count,
        rowsPerPage: this.state.size,
        rowsPerPageOptions: [5, 10, 15, 20],
        onRowClick: rowData => {
          const { history } = this.props;
          history.push(`/leave-request/${rowData[0]}`)
        },
        onChangeRowsPerPage: size => handleChangePageFunc(size, 1, demandUserId),
        onTableChange: (action, tableState) => {
          action === 'changePage' && handleChangePageFunc(tableState.rowsPerPage, tableState.page + 1, demandUserId)
        },
        customToolbar: () => {
          return (
            <LetterManagementToolbar
              filterValues={this.props.filterValues}
              onFilterValueChange={this.handleFilterValueChange}
            />
          )
        },
        download: true,
        downloadOptions: { 
          filename: `LEAVING_FORM_EXPORTS_${moment().locale('vi').format("DD-MM-YYYY_hh-mm-ss")}.csv`,
          filterOptions: {
            useDisplayedColumnsOnly: true,
          }
       },
        // setTableProps: () => {
        //   return {
        //     style: {
        //       color: 'rgba(0, 0, 0, 0.50)',
        //       fontWeight: 'bold',
        //     }
        //   }
        // }
      }
    };

    return (
      <Fragment>
        <MuiThemeProvider theme={materialTheme}>
          <MUIDataTable
            data={tableInfo.data}
            title={tableInfo.title}
            className={classes.paper}
            columns={tableInfo.columns}
            options={tableInfo.options}
          />
        </MuiThemeProvider>
      </Fragment>
    );
  }
}

const styles = theme => ({
  btnLink: {
    textDecoration: 'none',
  },
  paper: {
    padding: theme.spacing.unit * 5
  },
  title: {
    textAlign: 'left',
    marginTop: theme.spacing.unit * 3,
    marginBottom: theme.spacing.unit * 3
  },
});

const mapStateToProps = state => {
  const {status, fromDate, toDate} = state.letterFilterReducers;
  return {
    filterValues: {
      status,
      fromDate,
      toDate
    }
  }
}

const mapDispatchToProps = dispatch => {
  return {
    handleShowNotif: (type, message) => dispatch(showNotification(type, message)),
    handleChangeFilterValue: (values) => dispatch(letterFilterChangeAll(values)),
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(LetterManagement)
));
