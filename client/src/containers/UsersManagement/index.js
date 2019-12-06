import React from "react";
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import MUIDataTable from 'mui-datatables';
import DashContainer from "../DashContainer";
import { Button, Typography, withStyles } from "@material-ui/core";

/**
 * API calls
 */
import { getUsersList } from "../../apiCalls/userAPIs";

/**
 * Constants
 */
// import { availableStatusColor, availableStatusText } from "../../constants/user";

// Notification redux
import {
  showNotification,
} from '../../redux/actions/notificationActions';
import { NOTIF_ERROR } from '../../constants/notification';


const mapDispatchToProps = dispatch => {
  return {
    handleShowNotif: (type, message) =>
      dispatch(showNotification(type, message))
  };
};

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

class UsersManagement extends React.Component {
  state = {
    page: 1,
    size: 10,
    count: 0,
    users: [],
  }

  componentDidMount = async () => {
    try {
      const { data: { success, users, count } } = await getUsersList();
      if(success) this.setState({ users, count });
    }
    catch(err) {
      this.props.handleShowNotif(NOTIF_ERROR, err.message);
    }
  }
  
  changePage = async (size = 10, page = 1) => {
    try {
      const { data: { success, users, count } } = await getUsersList(size, page);
      if(success) this.setState({ users, count, size });
    }
    catch(err) {
      this.props.handleShowNotif(NOTIF_ERROR, err.message);
    }
  }

  render() {
    const { classes } = this.props;
    const { users, count, size } = this.state;
    
    const tableInfo = {
      columns: ['Name', /*'Status',*/ 'Team', 'Email', 'Actions'],
      title: <Typography component="span" variant="h4" className={classes.title}>All users</Typography>,
      data: Array.isArray(users) ? (
        users.map(({ fId, fFirstName, fLastName, fNickName, fEmail, fTeamName, fAvailable }) => [
            `${fLastName} ${fFirstName} ${fNickName ? `(${fNickName})` : ''}`,
            fTeamName,
            fEmail,
            <Link
              to={`/account/info/${fId}`}
              className={classes.btnLink}
            >
              <Button variant='contained' color='primary'>
                Details
              </Button>
            </Link>
          ]
        )
      ) : [],
      options: {
        count: count,
        print: false,
        filter: false,
        search: false,
        download: false,
        serverSide: true,
        rowsPerPage: size,
        viewColumns: false,
        responsive: 'scroll',
        selectableRows: false,
        rowsPerPageOptions: [5, 10, 15, 20],
        onChangeRowsPerPage: size => this.changePage(size, 1),
        onTableChange: (action, tableState) => action === 'changePage' && this.changePage(tableState.rowsPerPage, tableState.page + 1),
      }
    }

    return (
      <DashContainer>
        <MUIDataTable
          data={tableInfo.data}
          title={tableInfo.title}
          className={classes.paper}
          columns={tableInfo.columns}
          options={tableInfo.options}
        />
      </DashContainer>
    )
  }
}

export default connect(null, mapDispatchToProps)(
  withStyles(styles)(UsersManagement)
);