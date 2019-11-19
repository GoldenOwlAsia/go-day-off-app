import * as Yup from 'yup';
import { mockupLeaveLetterReasons } from '../../constants/mockups';
import { compareDatesWithoutTime } from '../../utilities';
/**
 *     leaveType: 1,
    startDate: new Date(),
    endDate: new Date(),
    approver: {},
    informTo: [],
    reason: '',
    otherReason: '',
 */
export const YupValidationSchema = Yup.object().shape({
  leaveType: Yup.number().required(`'Leave type' is required.`),
  // startDate: Yup.date().required(`'From date' is required.`),
  // endDate: Yup.date().required(`'End date' is required.`),
  approver: Yup.string()
    .min(1)
    .required(`'Approver' is required.`),
  informTo: Yup.array(),
  reason: Yup.string().required(`'Reason' is required.`)
});

export const CustomValidationSchema = (values) => {
  let errors = {};
  //Validate OtherReason
  // if (values.reason === mockupLeaveLetterReasons[mockupLeaveLetterReasons.length - 1].value 
  //   && values.otherReason === '') {
  //     errors.otherReason = `'Reason detail' can't be empty`;
  // } // comment for now
  if (compareDatesWithoutTime(values.startDate, values.endDate) === 1) {
    errors.startDate = `'From' date can't be after 'To' date`
  }
  return errors;
}