import * as Yup from 'yup';
import { PHONE_PATTERN, EMAIL_PATTERN } from '../../constants/regexPatterns';

/**
 * Fields' maxLength
 * 
 * firstName: 30
 * lastName: 30
 * phone: 10
 * email: 45
 */
const YupValidationSchema = Yup.object().shape({
  firstName: Yup.string()
              .max(30, `"First name" max length is ${30}`)
              .required(`"First name" can't be empty`),
  lastName: Yup.string()
            .max(30, `"Last name" max length is ${30}`)
            .required(`"Last name" can't be empty`),
  email: Yup.string()
          .max(45, `"Email" max length is ${45}`)
          .matches(EMAIL_PATTERN, `"Email" is invalid`)
          .required(`"Email" can't be empty`),
  phone: Yup.string()
          .min(10, `"Phone number" must be 10-character string`)
          .max(10, `"Phone number" must be 10-character string`)
          .matches(PHONE_PATTERN, `"Phone number" is invalid`)
          .required(`"Phone number" can't be empty`),
  rawPwd: Yup
          .string()
          .required('Please Enter your password')
          .matches(
            /^(((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})/,
            "Must be at least 8 characters long, must contain letters and numbers"
          ),
  rawConfirmPwd: Yup
          .string()
          .required(`Please confirm your password`)
          .oneOf([Yup.ref("rawPwd"), null], "Passwords must match"),
//   address:  Yup.string()
//           .required(`"Address" can't be empty`),
  position: Yup.string()
          .required(`"Position" can't be empty`),
  teamId: Yup.string()
          .required(`"Team" can't be empty`),
  gender: Yup.number()
          .moreThan(0, `Must select "Gender"`)
          .lessThan(4, `Invalid gender`)
          .integer(`Invalid gender`),
});

export default YupValidationSchema;