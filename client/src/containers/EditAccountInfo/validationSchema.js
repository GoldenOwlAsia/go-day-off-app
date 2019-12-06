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
  fFirstName: Yup.string()
              .max(30, `"First name" max length is ${30}`)
              .required(`"First name" can't be empty`),
  fLastName: Yup.string()
            .max(30, `"Last name" max length is ${30}`)
            .required(`"Last name" can't be empty`),
  fEmail: Yup.string()
          .max(45, `"Email" max length is ${45}`)
          .matches(EMAIL_PATTERN, `"Email" is invalid`)
          .required(`"Email" can't be empty`),
  fPhone: Yup.string()
          .min(10, `"Phone number" must be 10-character string`)
          .max(10, `"Phone number" must be 10-character string`)
          .matches(PHONE_PATTERN, `"Phone number" is invalid`)
          .required(`"Phone number" can't be empty`),
  fYearTotal: Yup.number()
          .required(`"Day-off" can't be empty`)
});

export default YupValidationSchema;