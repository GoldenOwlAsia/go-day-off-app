import React from "react";
import { Typography } from "@material-ui/core";
import DashContainer from "../DashContainer";
import LettersManagement from "../../components/LettersManagement";
import { getAllLeaveLetters, getAllLetterByFilter } from "../../apiCalls/leaveLetterAPI";

import { userTypes } from '../../constants/permission'

function AllLettersManagement() {
  return (
    <DashContainer>
      <Typography component="h1" variant="h4">
        All request letters
      </Typography>
      <br />
      <LettersManagement api={getAllLeaveLetters} filterAPI={getAllLetterByFilter} type={userTypes.MODE_ADMIN} />
    </DashContainer>
  );
}

export default AllLettersManagement;
