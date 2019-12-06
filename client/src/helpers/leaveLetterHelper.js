import {
  LEAVE_REQUEST_PENDING,
  LEAVE_REQUEST_APPROVED,
  LEAVE_REQUEST_REJECTED
} from "../constants/requestStatusType";

import {
  LEAVE_TYPE_PERSONNEL,
  LEAVE_TYPE_ANNUAL,
  LEAVE_TYPE_SICKNESS,
  LEAVE_TYPE_POLICY,
  LEAVE_TYPE_TRAVEL
} from "../constants/leaveTypes";

import PropTypes from "prop-types";

//Constants
const leaveTypesDescription = {
  [LEAVE_TYPE_PERSONNEL]: "Việc gia đình",
  [LEAVE_TYPE_SICKNESS]: "Nghỉ ốm",
  [LEAVE_TYPE_ANNUAL]: "Nghỉ phép năm",
  [LEAVE_TYPE_POLICY]: "Nghỉ chế độ",
  [LEAVE_TYPE_TRAVEL]: "Du lịch",
};
const leaveReqStatusDescription = {
  [LEAVE_REQUEST_PENDING]: "Pending",
  [LEAVE_REQUEST_APPROVED]: "Approved",
  [LEAVE_REQUEST_REJECTED]: "Rejected"
};

//Functions
export const getLeaveType = typeCode => {
  return leaveTypesDescription[typeCode];
};

export const getLeaveReqStatus = typeCode => {
  return leaveReqStatusDescription[typeCode];
};

export const getAllLeaveTypes = () => {
  let size = Object.keys(leaveTypesDescription).length;
  let leaveTypeArr = [];
  if (!size) return null;
  for (let i = 0; i < size; i++) {
    leaveTypeArr.push({
      value: i + 1,
      label: leaveTypesDescription[i + 1]
    });
  }
  return leaveTypeArr;
};

//PropTypes
getLeaveType.propTypes = {
  typeCode: PropTypes.number.isRequired
};
getLeaveReqStatus.propTypes = {
  typeCode: PropTypes.number.isRequired
};
