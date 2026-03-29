do not change anything like html,
css classes and other functions only snapshot change with getdoc,
and remove console and alert change with tost success and error,
in list component disable submit, save,update ,delete button when reader loged in 
get user info from import { useAuth } from '../context/AuthContext';
and user?.isReadOnly then disable