import {Navigate} from 'react-router-dom';import {useAuth} from '../lib/auth';import Customer from './Customer';
export default function Dashboard(){const{admin}=useAuth();return admin?<Navigate to="/admin"/>:<Customer/>}
