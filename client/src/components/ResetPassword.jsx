import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/axios'; // ✅ Aapka existing axios instance
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);

  const { password, confirmPassword } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8 || password.length > 16) {
      toast.error('Password must be between 8 and 16 characters');
      return;
    }

    try {
      setLoading(true);
      
      // ✅ Aapka existing API instance use karein
      const res = await API.put(
        `/password/reset/${token}`,  // /api/v1 ki zarurat nahi, API ne already baseURL me daal diya
        { password, confirmPassword }
      );
      
      toast.success(res.data.message);
      
      // 2 seconds baad login page par redirect
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

};

export default ResetPassword;