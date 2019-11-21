import React from 'react';
import moment from 'moment';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { CancelToken } from 'axios';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import $ from 'jquery';

import './fullCalendar.scss'
import './Calendar.css';

// constant
import { userTypes } from '../../constants/permission'

// api
import { getAllLetterByFilter, getDemandLetterByFilter } from '../../apiCalls/leaveLetterAPI'

// helpers
import { getUserId } from '../../helpers/authHelpers'
import { getUserTypeFromCookie } from '../../helpers/getUserInfo'

// Notification redux
import {
  showNotification,
} from '../../redux/actions/notificationActions';

const mapDispatchToProps = (dispatch) => {
  return {
    handleShowNotif: (type, message) => dispatch(showNotification(type, message))
  }
}

const letterStatus = ['Pending', 'Approved', 'Cancelled'];

class Calendar extends React.Component {
  state = {
    selectedDate: moment(),
    events: [],
  };

  isAdmin = getUserTypeFromCookie() === userTypes.MODE_ADMIN;

  componentWillMount = async () => {
    this.cancelSource = CancelToken.source();

    this.setEvents();
  }

  componentDidMount = () => {
    this.__isMounted__ = true;

    $(document).ready(() => {
      $(".fc-next-button").click(() => {
        this.setState({ selectedDate: this.state.selectedDate.add(1, 'month') });

        this.setEvents();
      })

      $(".fc-prev-button").click(() => {
        this.setState({ selectedDate: this.state.selectedDate.subtract(1, 'month')  });

        this.setEvents();
      })

      $(".fc-today-button").click(() => {
        this.setState({ selectedDate: moment() });

        this.setEvents();
      })
    })
  }

  componentWillUnmount = () => {
    this.__isMounted__ = false;
    this.cancelSource.cancel();
  }

  onEventClick = (info) => {
    const { history } = this.props;
    history.push(`/leave-request/${info.event.id}`);
  }

  setEvents = async () => {
    const { isAdmin, cancelSource } = this;
    const { selectedDate } = this.state;
    const selectedMonth = selectedDate.month() + 1;
    const selectedYear = selectedDate.year();
    const filterData = {
      userId: getUserId(),
      fromDay: 1,
      fromMonth: selectedMonth,
      fromYear: selectedYear,
      toDay: selectedDate.endOf('months').date(),
      toMonth: selectedMonth,
      toYear: selectedYear,
      size: 0,
    }

    const res = await getDemandLetterByFilter(cancelSource.token, filterData);
    const letters = res.data.leaveLetters;

    const events = letters.map(letter => {
      const backgroundColor = letter.fStatus === 1 ? '#fac863': letter.fStatus === 2 ? '#32CC32' : '#FF000D';
      const textColor = 'white'

      return {
        id: letter.fId,
        title: letterStatus[letter.fStatus - 1],
        start: letter.fFromDT.toString().substring(0, 10),
        end: moment(letter.fToDT.toString()).add(1, 'day').toISOString().substring(0, 10),
        backgroundColor,
        borderColor: backgroundColor,
        textColor,
      }
    })

    isAdmin ? this.setAdminEvents(events) : this.setState({ events });
  }

  setAdminEvents = async (events) => {
    const { cancelSource } = this;
    const { selectedDate } = this.state;
    const selectedMonth = selectedDate.month() + 1;
    const selectedYear = selectedDate.year();

    const adminFilterData = {
      fromDay: 1,
      fromMonth: selectedMonth,
      fromYear: selectedYear,
      toDay: selectedDate.endOf('months').date(),
      toMonth: selectedMonth,
      toYear: selectedYear,
      size: 0,
    };

    const res = await getAllLetterByFilter(cancelSource.token, adminFilterData);

    const adminLetters = res.data.leaveLetters.filter(letter => !events.find(e => e.id === letter.fId));

    adminLetters.map(letter => {
      const backgroundColor = letter.fStatus === 1 ? '#fac863': letter.fStatus === 2 ? '#32CC32' : '#FF000D';
      const textColor = 'white'

      const event = {
        id: letter.fId,
        title: `${letter.fUserFullName} - ${letterStatus[letter.fStatus - 1]}`,
        start: letter.fFromDT.toString().substring(0, 10),
        end: moment(letter.fToDT.toString()).add(1, 'day').toISOString().substring(0, 10),
        backgroundColor,
        borderColor: backgroundColor,
        textColor,
      }

      events.push(event);
    })

    this.setState({ events });
  }
  
  render() {
    return (
      <div style={{ borderTop: '4px solid #fac863', borderBottom: '4px solid #fac863', paddingTop: '20px' }}>
        <FullCalendar 
          themeSystem='lux' 
          defaultView="dayGridMonth" 
          plugins={[dayGridPlugin]} 
          events={this.state.events}
          // eventColor={'#fac863'}
          // eventTextColor={'black'}
          eventClick={this.onEventClick}
          datesRender={this.viewRender}
        />
      </div>
    );
  }
}

export default withRouter(connect(null, mapDispatchToProps)(Calendar));
